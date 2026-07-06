// Phase-2 ingestion framework (source-agnostic). Each LiveAdapter fetches real
// open data for the Comune di Ragusa, normalizes it, and upserts it into the
// object-model tables. The orchestrator updates each source's real provenance +
// health: success → status 'ok' with fresh retrieved/rows/observed; failure →
// the last-good data is preserved and the source flips to 'warn' (a rischio),
// exactly the design's ingestion-health model (cf. ANAC in the mockup).
//
// This is a SCRIPT-ONLY concern (run via `pnpm ingest`), like the seed runner.
// The app never imports it; surfaces read the resulting rows via the repository.

import { randomUUID } from "node:crypto";
import { eq, and, sql as dsql } from "drizzle-orm";
import { parse } from "csv-parse/sync";
import { db } from "@/lib/db/client";
import { sources, ingestRuns } from "@/lib/db/schema";
// Date helpers live in the shared formatter module; imported for internal use
// and re-exported for the adapters that import them from the framework.
import { fmtDate, fmtRefresh } from "@/lib/format";
export { fmtDate, fmtRefresh };

export interface FetchOutcome<T = unknown> {
  /** true when live data was retrieved and normalized successfully. */
  ok: boolean;
  /** number of source records behind this refresh (shown as `rows`). */
  rows: number;
  /** the period/date observed, e.g. "2024" or "01/01/2025". */
  observed: string;
  /** normalized payload handed to apply() (present only when ok). */
  data?: T;
  /** human note appended to the refresh line (esp. on failure). */
  note?: string;
}

export interface LiveAdapter<T = unknown> {
  /** matches a `sources` table id (e.g. "istat"). */
  id: string;
  label: string;
  /** what part of the model this refreshes (for logs). */
  feeds: string;
  /** fetch live + normalize. MUST NOT throw for expected failures — return ok:false. */
  fetch(): Promise<FetchOutcome<T>>;
  /** idempotently upsert the normalized payload into model tables. */
  apply(data: T): Promise<void>;
}

// ---- fetch helpers ----
const UA = "RagusIA-ingest/1.0 (+https://github.com/) civic-data";

export async function fetchText(
  url: string,
  opts: { timeoutMs?: number; encoding?: "utf-8" | "windows-1252" | "latin1"; headers?: Record<string, string> } = {},
): Promise<string> {
  const { timeoutMs = 30000, encoding = "utf-8", headers = {} } = opts;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "user-agent": UA, ...headers } });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    const buf = new Uint8Array(await res.arrayBuffer());
    const dec = new TextDecoder(encoding === "latin1" ? "windows-1252" : encoding);
    return dec.decode(buf);
  } finally {
    clearTimeout(t);
  }
}

export async function fetchJson<J = unknown>(url: string, opts?: Parameters<typeof fetchText>[1]): Promise<J> {
  return JSON.parse(await fetchText(url, opts)) as J;
}

// Some government endpoints (notably ISTAT SDMX) return HTTP 500 to Node's
// undici `fetch` while responding 200 to curl for the identical request — an
// HTTP-client incompatibility, not a rate limit. Ingestion is a script-time
// concern (never a request path), so shelling out to the system curl is a safe,
// reliable fallback. `-f` makes curl exit non-zero on HTTP >= 400 → the caller's
// try/catch degrades the source to `warn`, preserving last-good data.
export async function curlText(
  url: string,
  opts: { timeoutSec?: number; accept?: string } = {},
): Promise<string> {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const run = promisify(execFile);
  const { timeoutSec = 30, accept = "application/json" } = opts;
  const { stdout } = await run(
    "curl",
    ["-sS", "-f", "--max-time", String(timeoutSec), "-H", `Accept: ${accept}`, "-A", UA, url],
    { maxBuffer: 64 * 1024 * 1024 },
  );
  return stdout;
}

export async function curlJson<J = unknown>(url: string, opts?: Parameters<typeof curlText>[1]): Promise<J> {
  return JSON.parse(await curlText(url, opts)) as J;
}

// Desktop Chrome UA — some portals (ANAC) sit behind a WAF that rejects
// non-browser clients. curl with this UA passes; Node's fetch may be blocked.
const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

/** Download a binary file (e.g. a zip) via curl with a browser UA → bytes. */
export async function curlBuffer(url: string, timeoutSec = 180): Promise<Uint8Array> {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const run = promisify(execFile);
  const { stdout } = await run(
    "curl",
    ["-sS", "-f", "--max-time", String(timeoutSec), "-A", BROWSER_UA, url],
    { maxBuffer: 512 * 1024 * 1024, encoding: "buffer" },
  );
  return new Uint8Array(stdout as Buffer);
}

/** Parse a delimited gov CSV into row objects (auto-detects ; vs , when delimiter omitted). */
export function parseCsv(text: string, delimiter?: string): Record<string, string>[] {
  const delim = delimiter ?? (text.slice(0, 2000).split("\n")[0].includes(";") ? ";" : ",");
  return parse(text, {
    columns: true,
    delimiter: delim,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
    bom: true,
  }) as Record<string, string>[];
}

// ---- provenance / health update ----
async function updateProvenance(
  id: string,
  patch: Partial<{ retrieved: string; observed: string; rows: string; status: "ok" | "warn"; refresh: string }>,
): Promise<void> {
  await db.update(sources).set(patch).where(eq(sources.id, id));
}

export type GuardVerdict = "first" | "ok" | "drop" | "empty";

export interface IngestReport {
  id: string;
  status: "ok" | "warn";
  rows: number;
  guard: GuardVerdict;
  note?: string;
}

/** The last-SUCCESSFUL row count for a source, from ingest_runs (integer, avoids
 *  the Italian-formatted `sources.rows` string). Filters to status='ok' so one
 *  failed run doesn't erase the count-guard baseline, and orders by the parsed
 *  timestamp (ran_at is 'dd/mm/yyyy hh:mm' text — a lexicographic sort is wrong
 *  across month boundaries). */
// Sortable timestamp from the 'dd/mm/yyyy hh:mm' text column, guarded so a
// single malformed/legacy ran_at row can't make to_timestamp() raise and abort
// the query (it sorts last instead).
const RANAT_TS = dsql`case when ${ingestRuns.ranAt} ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4} [0-9]{2}:[0-9]{2}$' then to_timestamp(${ingestRuns.ranAt}, 'DD/MM/YYYY HH24:MI') else null end`;

async function prevRowCount(sourceId: string): Promise<number | null> {
  try {
    const [last] = await db
      .select({ rows: ingestRuns.rows })
      .from(ingestRuns)
      .where(and(eq(ingestRuns.sourceId, sourceId), eq(ingestRuns.status, "ok")))
      .orderBy(dsql`${RANAT_TS} DESC NULLS LAST`)
      .limit(1);
    return last ? last.rows : null;
  } catch (e) {
    // Never let a baseline lookup abort the whole ingest run — degrade to "first".
    console.warn(`  ⚠ prevRowCount(${sourceId}) failed, treating as first:`, (e as Error).message);
    return null;
  }
}

/** Count-guard: compare this run's rows to the previous successful count. */
export function guardVerdict(prev: number | null, now: number): GuardVerdict {
  if (prev === null || prev === 0) return "first";
  if (now === 0) return "empty";
  if (now < prev * 0.5) return "drop";
  return "ok";
}

async function recordRun(
  sourceId: string,
  ranAt: string,
  status: "ok" | "warn",
  rows: number,
  prev: number | null,
  guard: GuardVerdict,
  note?: string,
): Promise<void> {
  await db.insert(ingestRuns).values({
    id: randomUUID(),
    sourceId,
    ranAt,
    status,
    rows,
    prevRows: prev,
    delta: prev === null ? null : rows - prev,
    guard,
    note: note ?? null,
  });
}

/** Run the given adapters; returns a per-source report. Never throws for one bad
 *  source. The count-guard runs BEFORE apply(): a 'drop'/'empty' verdict blocks
 *  the write so a partial/shrunken fetch cannot overwrite last-good data (pass
 *  `force` / INGEST_FORCE=1 to override when a real drop is expected). */
export async function runIngest(
  adapters: LiveAdapter[],
  opts: { force?: boolean } = {},
): Promise<IngestReport[]> {
  const force = opts.force ?? process.env.INGEST_FORCE === "1";

  // Sources are independent, so ingest them concurrently — wall time becomes the
  // slowest single source, not the sum. Each keeps its own try/catch, provenance
  // write and count-guard baseline (read from its own history), so concurrency is
  // safe; only the interleaving of log lines changes. Order of reports is
  // preserved (Promise.all keeps input order).
  async function ingestOne(a: LiveAdapter): Promise<IngestReport> {
    const now = new Date();
    const ranAt = fmtRefresh(now);
    const prev = await prevRowCount(a.id);
    try {
      const out = await a.fetch();
      if (out.ok && out.data !== undefined) {
        const guard = guardVerdict(prev, out.rows);
        // `empty` (0 rows over a non-empty baseline) always blocks — force only
        // overrides a suspicious-but-non-zero `drop`. A forced empty write would
        // both wipe last-good data and reset the baseline to 0, silently
        // disabling the guard for the next run.
        const blocked = guard === "empty" || (guard === "drop" && !force);
        if (blocked) {
          // Count-guard BLOCKS the write: last-good data is preserved, source → warn.
          const note = `count-guard ${guard}: ${prev} → ${out.rows} righe`;
          await updateProvenance(a.id, { status: "warn", refresh: `${ranAt} · ${note}` });
          await recordRun(a.id, ranAt, "warn", out.rows, prev, guard, note);
          console.warn(
            `  ⛔ COUNT-GUARD [${guard}] ${a.id}: ${prev} → ${out.rows} righe — scrittura BLOCCATA, dati precedenti conservati${guard === "drop" ? " (INGEST_FORCE=1 per forzare)" : ""}`,
          );
          return { id: a.id, status: "warn", rows: out.rows, guard, note };
        }
        await a.apply(out.data);
        await updateProvenance(a.id, {
          status: "ok",
          rows: String(out.rows),
          observed: out.observed,
          retrieved: fmtDate(now),
          refresh: ranAt,
        });
        await recordRun(a.id, ranAt, "ok", out.rows, prev, guard);
        console.log(`  ✓ ${a.id.padEnd(12)} ${a.feeds} · ${out.rows} righe · osservato ${out.observed}`);
        return { id: a.id, status: "ok", rows: out.rows, guard };
      }
      const note = out.note ?? "ingestione fallita";
      await updateProvenance(a.id, { status: "warn", refresh: `${ranAt} · ${note}` });
      await recordRun(a.id, ranAt, "warn", 0, prev, "empty", note);
      console.log(`  ⚠ ${a.id.padEnd(12)} ${a.feeds} · a rischio (${note}) — dati precedenti conservati`);
      return { id: a.id, status: "warn", rows: 0, guard: "empty", note };
    } catch (e) {
      const note = (e as Error).message.slice(0, 80);
      // Best-effort recovery write — must not itself throw, or it would reject
      // the whole concurrent run and discard every other source's report.
      try {
        await updateProvenance(a.id, { status: "warn", refresh: `${ranAt} · errore` });
        await recordRun(a.id, ranAt, "warn", 0, prev, "empty", note);
      } catch (e2) {
        console.warn(`  ⚠ recovery write failed for ${a.id}:`, (e2 as Error).message);
      }
      console.log(`  ✗ ${a.id.padEnd(12)} ${a.feeds} · errore: ${note} — dati precedenti conservati`);
      return { id: a.id, status: "warn", rows: 0, guard: "empty", note };
    }
  }

  // Bounded concurrency: sources run in parallel but at most INGEST_CONCURRENCY at
  // once (default 4), so a few heavy CSV parses (ANAC national zips) can't stack
  // to an OOM. ingestOne never rejects, so one bad source can't abort the run.
  const limit = Math.max(1, Number(process.env.INGEST_CONCURRENCY) || 4);
  const reports: IngestReport[] = new Array(adapters.length);
  let next = 0;
  async function worker(): Promise<void> {
    while (next < adapters.length) {
      const idx = next++;
      reports[idx] = await ingestOne(adapters[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, adapters.length) }, worker));
  return reports;
}
