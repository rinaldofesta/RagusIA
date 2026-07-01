// Phase-2 ingestion framework (source-agnostic). Each LiveAdapter fetches real
// open data for the Comune di Ragusa, normalizes it, and upserts it into the
// object-model tables. The orchestrator updates each source's real provenance +
// health: success → status 'ok' with fresh retrieved/rows/observed; failure →
// the last-good data is preserved and the source flips to 'warn' (a rischio),
// exactly the design's ingestion-health model (cf. ANAC in the mockup).
//
// This is a SCRIPT-ONLY concern (run via `pnpm ingest`), like the seed runner.
// The app never imports it; surfaces read the resulting rows via the repository.

import { eq } from "drizzle-orm";
import { parse } from "csv-parse/sync";
import { db } from "@/lib/db/client";
import { sources } from "@/lib/db/schema";

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

// ---- date helpers (real timestamps; this runs in a normal Node/tsx process) ----
const pad = (n: number) => String(n).padStart(2, "0");
export function fmtDate(d: Date): string {
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}
export function fmtRefresh(d: Date): string {
  return `${fmtDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

export interface IngestReport {
  id: string;
  status: "ok" | "warn";
  rows: number;
  note?: string;
}

/** Run the given adapters; returns a per-source report. Never throws for one bad source. */
export async function runIngest(adapters: LiveAdapter[]): Promise<IngestReport[]> {
  const reports: IngestReport[] = [];
  for (const a of adapters) {
    const now = new Date();
    try {
      const out = await a.fetch();
      if (out.ok && out.data !== undefined) {
        await a.apply(out.data);
        await updateProvenance(a.id, {
          status: "ok",
          rows: String(out.rows),
          observed: out.observed,
          retrieved: fmtDate(now),
          refresh: fmtRefresh(now),
        });
        console.log(`  ✓ ${a.id.padEnd(12)} ${a.feeds} · ${out.rows} righe · osservato ${out.observed}`);
        reports.push({ id: a.id, status: "ok", rows: out.rows });
      } else {
        const note = out.note ?? "ingestione fallita";
        await updateProvenance(a.id, { status: "warn", refresh: `${fmtRefresh(now)} · ${note}` });
        console.log(`  ⚠ ${a.id.padEnd(12)} ${a.feeds} · a rischio (${note}) — dati precedenti conservati`);
        reports.push({ id: a.id, status: "warn", rows: 0, note });
      }
    } catch (e) {
      const note = (e as Error).message.slice(0, 80);
      await updateProvenance(a.id, { status: "warn", refresh: `${fmtRefresh(now)} · errore` });
      console.log(`  ✗ ${a.id.padEnd(12)} ${a.feeds} · errore: ${note} — dati precedenti conservati`);
      reports.push({ id: a.id, status: "warn", rows: 0, note });
    }
  }
  return reports;
}
