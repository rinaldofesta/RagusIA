// NL→SQL engine. Claude generates one read-only SELECT against the flat fact
// tables (see schema-context.ts); the app validates it, executes it inside a
// READ ONLY transaction (statement timeout + row cap, always rolled back), and
// returns the real SQL + rows + which sources were touched. Defense in depth:
//   1. a single-SELECT validator + TABLE ALLOWLIST (referencesOnlyAllowedTables);
//   2. the read-only transaction runs as the least-privilege `query_reader` role
//      (migration 0002) which has SELECT on ONLY the six fact/entity/source
//      tables — so even if the allowlist is ever bypassed, the DB itself refuses
//      to read Supabase `auth`/`storage`/`vault` or any other schema.
// The prompt only *asks* the model to stay on the fact tables; layers 1–2 enforce it.

import { sql } from "@/lib/db/client";
import { isQueryEnabled, generateSql } from "./provider";
import { SCHEMA_CONTEXT } from "./schema-context";

export interface SqlAnswerResult {
  sql: string;
  rows: Record<string, unknown>[];
  columns: string[];
  sourceIds: string[];
  noAnswer: boolean;
}

const ROW_CAP = 200;

/** Pull the SQL out of a model reply (strip ``` fences / prose; take from first SELECT|WITH). */
export function extractSql(raw: string): string {
  let s = raw.trim();
  const fence = /```(?:sql)?\s*([\s\S]*?)```/i.exec(s);
  if (fence) s = fence[1].trim();
  const m = /\b(select|with)\b/i.exec(s);
  if (m) s = s.slice(m.index);
  return s.replace(/;\s*$/, "").trim();
}

// Single source of truth for what the engine may touch. Fact tables carry the
// source they attribute to; entities/sources are readable metadata (no source).
// SCHEMA_CONTEXT (the prompt) describes these same tables — keep them in sync.
// Exported so a test can assert they stay in sync with the Drizzle schema and the
// SCHEMA_CONTEXT prompt (the 3-place invariant in ADR-0001).
export const FACT_SOURCES: Record<string, string> = {
  fact_contracts: "anac",
  fact_budget: "bdap",
  fact_pnrr: "openpnrr",
  fact_coesione: "opencoesione",
};
export const ALLOWED_TABLES = new Set([...Object.keys(FACT_SOURCES), "entities", "sources"]);

// Catalog functions / role-introspection tokens that never belong in a fact
// query and would disclose the DB role, version, or filesystem.
const BLOCKED_TOKEN =
  /\b(pg_[a-z_]+|current_setting|current_user|current_role|current_catalog|current_schema|session_user|version|pg_read_file|pg_ls_dir|dblink|lo_import|lo_export)\b/i;

// Keywords that terminate a whole FROM clause (JOIN/ON/LEFT/… are NOT here —
// they are internal to a FROM item and must not cut off later comma tables).
const FROM_TERM = new Set([
  "where", "group", "having", "order", "limit", "offset", "union", "except",
  "intersect", "window", "returning", "for",
]);

/** Remove comments and string literals (single-quoted AND dollar-quoted) so
 *  evasion hidden inside them can't slip past the structural checks below. */
function stripNoise(q: string): string {
  return q
    .replace(/\$([a-zA-Z_]\w*)?\$[\s\S]*?\$\1\$/g, "''") // $$…$$ / $tag$…$tag$
    .replace(/--[^\n]*/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/'(?:[^']|'')*'/g, "''");
}

/** Blank out FROM/FOR/PLACING/IN used as SQL *syntax* inside extract()/substring()/
 *  trim()/overlay()/position() so the FROM-clause parser doesn't mistake
 *  `extract(year from x)` for a table source. Only blanks at the function's own
 *  argument level (depth 1) — a nested subquery's real FROM (e.g.
 *  `trim(both from (select … from auth.users))`) is left intact so it's still
 *  caught by the allowlist. */
function neutralizeFunctionKeywords(q: string): string {
  const funcs = /\b(?:extract|substring|overlay|trim|position)\s*\(/gi;
  const chars = q.split("");
  let m: RegExpExecArray | null;
  while ((m = funcs.exec(q))) {
    let i = m.index + m[0].length;
    let depth = 1;
    while (i < q.length && depth > 0) {
      const ch = q[i];
      if (ch === "(") { depth++; i++; }
      else if (ch === ")") { depth--; i++; }
      else if (depth === 1 && /[a-z_]/i.test(ch)) {
        const w = q.slice(i).match(/^[a-z_]+/i)![0];
        const kw = w.toLowerCase();
        if (kw === "from" || kw === "for" || kw === "placing" || kw === "in") {
          for (let k = 0; k < w.length; k++) chars[i + k] = " ";
        }
        i += w.length;
      } else i++;
    }
  }
  return chars.join("");
}

/** CTE names defined via `WITH [RECURSIVE] name AS (` / `, name AS (` — allowed
 *  as table refs. */
function cteNames(q: string): Set<string> {
  const names = new Set<string>();
  const re = /(?:\bwith\s+(?:recursive\s+)?|,\s+)([a-z_]\w*)\s+as\s*\(/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(q))) names.add(m[1].toLowerCase());
  return names;
}

/** Every base table brought into scope by a FROM or JOIN — the ONLY place a
 *  table can be read. Splits each FROM clause into comma-separated items at paren
 *  depth 0 (JOIN chains stay within their item, so a trailing `…, auth.users`
 *  after a JOIN is still seen), and from each item takes the leading table plus
 *  every JOIN target. Derived-table subqueries `(SELECT …)` and LATERAL are
 *  skipped — their own FROM is matched separately. Column qualifiers (`t.col`)
 *  are ignored: a table can't be read from an expression position. */
function fromClauseTables(q: string): string[] {
  const refs: string[] = [];
  const fromKw = /\bfrom\b/gi;
  let fm: RegExpExecArray | null;
  while ((fm = fromKw.exec(q))) {
    let depth = 0;
    let buf = "";
    const items: string[] = [];
    const flush = () => {
      const it = buf.trim();
      if (it) items.push(it);
      buf = "";
    };
    let i = fm.index + 4;
    while (i < q.length) {
      const ch = q[i];
      if (ch === "(") { depth++; buf += ch; }
      else if (ch === ")") { if (depth === 0) break; depth--; buf += ch; }
      else if (depth === 0 && ch === ",") { flush(); }
      else if (depth === 0 && /\s/.test(ch)) {
        const word = q.slice(i + 1).match(/^([a-z_]+)\b/i);
        if (word && FROM_TERM.has(word[1].toLowerCase())) break;
        buf += ch;
      } else buf += ch;
      i++;
    }
    flush();
    for (const it of items) {
      if (it.startsWith("(")) continue; // derived table — its inner FROM is matched separately
      const lead = it.match(/^([a-z_]\w*(?:\.[a-z_]\w*)?)/i);
      if (lead && lead[1].toLowerCase() !== "lateral") refs.push(lead[1].toLowerCase());
      for (const jm of it.matchAll(/\bjoin\s+([a-z_]\w*(?:\.[a-z_]\w*)?)/gi)) {
        if (jm[1].toLowerCase() !== "lateral") refs.push(jm[1].toLowerCase());
      }
    }
  }
  return refs;
}

/** True only for a single read-only SELECT/WITH statement. */
export function isSafeSelect(q: string): boolean {
  const s = q.trim();
  if (!/^(select|with)\b/i.test(s)) return false;
  // no second statement
  if (s.replace(/;\s*$/, "").includes(";")) return false;
  // no data/DDL/side-effecting keywords
  if (/\b(insert|update|delete|drop|alter|truncate|create|grant|revoke|copy|call|do|merge|vacuum|analyze|set|reset)\b/i.test(s)) {
    return false;
  }
  return true;
}

/** The real security boundary: the query may read ONLY the allowlisted tables.
 *  Layered so comma-joins, quoting, comments and subqueries can't slip a foreign
 *  table (Supabase auth/storage/vault, pg_* catalogs) through:
 *   1. reject quoted identifiers — the main way to smuggle a schema qualifier
 *      past a regex, and never needed by a fact query;
 *   2. strip comments/strings, then blank FROM/FOR used as function syntax;
 *   3. block catalog/introspection tokens (pg_*, current_*, version, …);
 *   4. every base table brought into a FROM/JOIN (incl. comma lists and nested
 *      subqueries) must be an unqualified allowlisted table or a CTE — a schema
 *      qualifier other than `public` is rejected. Column qualifiers are ignored
 *      because a table can only be read from a FROM clause.
 *  A constant SELECT with no FROM (e.g. the `no_answer` sentinel) is fine. */
export function referencesOnlyAllowedTables(q: string): boolean {
  if (q.includes('"')) return false;
  const norm = neutralizeFunctionKeywords(stripNoise(q));
  if (BLOCKED_TOKEN.test(norm)) return false;

  const ctes = cteNames(norm);
  for (const ref of fromClauseTables(norm)) {
    const [schema, table] = ref.includes(".") ? ref.split(".") : ["public", ref];
    if (schema !== "public") return false;
    if (!ALLOWED_TABLES.has(table) && !ctes.has(table)) return false;
  }
  return true;
}

/** Append a LIMIT if the query has none. */
export function ensureLimit(q: string, cap = ROW_CAP): string {
  return /\blimit\b/i.test(q) ? q : `${q}\nlimit ${cap}`;
}

// Least-privilege DB role for generated SQL (migration 0002). Validated to a
// bare identifier so it's safe to interpolate into SET ROLE. Set QUERY_DB_ROLE=""
// to disable (falls back to the app role — allowlist stays the only boundary).
const QUERY_ROLE_RAW = (process.env.QUERY_DB_ROLE ?? "query_reader").trim();
const QUERY_ROLE = /^[a-z_][a-z0-9_]*$/.test(QUERY_ROLE_RAW) ? QUERY_ROLE_RAW : "";

// Probe once per process whether the app role can actually SET ROLE into the
// reader role. We test the real operation rather than pg_has_role(...,'MEMBER'):
// that check yields a false positive under Supabase, where the `postgres` role
// holds ADMIN on query_reader (it created it) yet is DENIED SET ROLE (PG16 splits
// membership from the SET privilege) and cannot be granted WITH SET (supautils
// rejects grants to the reserved `postgres` role). When SET ROLE isn't possible,
// degrade gracefully — the app-layer allowlist + read-only tx still guard every
// query. Cached so it costs one probe, ever.
let roleAvailable: Promise<boolean> | null = null;
function queryRoleAvailable(): Promise<boolean> {
  if (!QUERY_ROLE) return Promise.resolve(false);
  if (!roleAvailable) {
    roleAvailable = sql
      .begin(async (tx) => {
        await tx.unsafe(`set local role ${QUERY_ROLE}`);
      })
      .then(() => true)
      .catch((e: { code?: string }) => {
        // 42501 = permission denied to set role: persistent, cache the false.
        // Anything else (role missing, connection error) may be transient —
        // clear the cache so the next call re-probes.
        if (e?.code !== "42501") roleAvailable = null;
        return false;
      });
  }
  return roleAvailable;
}

// One-time loudness: if the query engine is live but the least-privilege role
// isn't (migration 0002 didn't run), the DB boundary has silently degraded to the
// app role + allowlist. Say so once, at error level. The /api/health endpoint
// (roadmap M3) will surface the same flag.
let warnedNoRole = false;

/** Execute a validated SELECT inside a READ ONLY transaction (timeout + rollback),
 *  dropped into the least-privilege reader role when available. */
export async function execReadOnly(query: string): Promise<Record<string, unknown>[]> {
  const useRole = await queryRoleAvailable();
  if (!useRole && isQueryEnabled() && !warnedNoRole) {
    warnedNoRole = true;
    console.error(
      "[query] query_reader role unavailable — generated SQL runs as the app role; apply migration 0002 to restore the least-privilege boundary.",
    );
  }
  return sql.begin(async (tx) => {
    await tx.unsafe("set transaction read only");
    await tx.unsafe("set local statement_timeout = 4000");
    if (useRole) await tx.unsafe(`set local role ${QUERY_ROLE}`);
    const rows = await tx.unsafe(query);
    // postgres.js returns a rows array; cap defensively.
    return (rows as unknown as Record<string, unknown>[]).slice(0, ROW_CAP);
  }) as Promise<Record<string, unknown>[]>;
}

function inferSources(q: string): string[] {
  const found = new Set<string>();
  for (const [table, src] of Object.entries(FACT_SOURCES)) {
    if (new RegExp(`\\b${table}\\b`, "i").test(q)) found.add(src);
  }
  return [...found];
}

/** Generate → validate → execute. Returns null when disabled, unsafe, or on error. */
export async function answerWithSql(question: string): Promise<SqlAnswerResult | null> {
  if (!isQueryEnabled()) return null;
  const raw = await generateSql(SCHEMA_CONTEXT, question);
  if (!raw) return null;

  const candidate = ensureLimit(extractSql(raw));
  if (!isSafeSelect(candidate)) return null;
  if (!referencesOnlyAllowedTables(candidate)) return null;

  try {
    const rows = await execReadOnly(candidate);
    const noAnswer =
      rows.length === 1 &&
      Object.keys(rows[0]).length === 1 &&
      String(Object.values(rows[0])[0]).toLowerCase() === "no_answer";
    return {
      sql: candidate,
      rows: noAnswer ? [] : rows,
      columns: !noAnswer && rows[0] ? Object.keys(rows[0]) : [],
      sourceIds: inferSources(candidate),
      noAnswer,
    };
  } catch (err) {
    console.warn("[query] execution error:", (err as Error).message);
    return null;
  }
}
