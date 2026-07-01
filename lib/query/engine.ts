// NL→SQL engine. Claude generates one read-only SELECT against the flat fact
// tables (see schema-context.ts); the app validates it, executes it inside a
// READ ONLY transaction (statement timeout + row cap, always rolled back), and
// returns the real SQL + rows + which sources were touched. Layered safety:
// a single-SELECT validator AND a read-only transaction.

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

/** Append a LIMIT if the query has none. */
export function ensureLimit(q: string, cap = ROW_CAP): string {
  return /\blimit\b/i.test(q) ? q : `${q}\nlimit ${cap}`;
}

/** Execute a validated SELECT inside a READ ONLY transaction (timeout + rollback). */
export async function execReadOnly(query: string): Promise<Record<string, unknown>[]> {
  return sql.begin(async (tx) => {
    await tx.unsafe("set transaction read only");
    await tx.unsafe("set local statement_timeout = 4000");
    const rows = await tx.unsafe(query);
    // postgres.js returns a rows array; cap defensively.
    return (rows as unknown as Record<string, unknown>[]).slice(0, ROW_CAP);
  }) as Promise<Record<string, unknown>[]>;
}

const SOURCE_OF_TABLE: Record<string, string> = {
  fact_contracts: "anac",
  fact_budget: "bdap",
  fact_pnrr: "openpnrr",
  fact_coesione: "opencoesione",
};

function inferSources(q: string): string[] {
  const found = new Set<string>();
  for (const [table, src] of Object.entries(SOURCE_OF_TABLE)) {
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
