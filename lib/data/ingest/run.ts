// CLI: `pnpm ingest [sourceId ...]` (or no args / "all" for every registered adapter).
// Fetches live open data for the Comune di Ragusa, upserts it into Postgres, and
// updates each source's provenance/health. Sources without a live adapter are left
// on their seed data.
//
// Exit code: 0 only when every source ended `ok` AND no registered source's data
// is stale (last ok run older than INGEST_STALE_DAYS, default 7). Any `warn` (a
// fetch failure or count-guard block) or a stale source exits non-zero so the
// scheduled GitHub Action fails and notifies — degraded or rotting data must not
// pass silently. A forced run that ends all-`ok` and fresh still exits 0.
import { appendFileSync } from "node:fs";
import { sql as dsql } from "drizzle-orm";
import { sql, db } from "@/lib/db/client";
import { ingestRuns } from "@/lib/db/schema";
import { cleanupRateLimits } from "@/lib/ratelimit";
import { runIngest, type IngestReport } from "./framework";
import { liveAdapters, selectAdapters } from "./index";

const STALE_DAYS = Number(process.env.INGEST_STALE_DAYS) || 7;

/** Registered sources whose most recent `ok` run is missing or older than
 *  STALE_DAYS. `ran_at` is 'dd/mm/yyyy hh:mm' text, parsed with the same guard
 *  the count-guard baseline uses. */
async function findStale(): Promise<{ id: string; ageDays: number | null }[]> {
  const rows = (await db
    .select({
      sourceId: ingestRuns.sourceId,
      ageDays: dsql<number | null>`extract(day from now() - max(case when ${ingestRuns.ranAt} ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4} [0-9]{2}:[0-9]{2}$' then to_timestamp(${ingestRuns.ranAt}, 'DD/MM/YYYY HH24:MI') else null end))`,
    })
    .from(ingestRuns)
    .where(dsql`${ingestRuns.status} = 'ok'`)
    .groupBy(ingestRuns.sourceId)) as { sourceId: string; ageDays: number | null }[];
  const ageById = new Map(rows.map((r) => [r.sourceId, r.ageDays]));
  return liveAdapters
    .map((a) => ({ id: a.id, ageDays: ageById.get(a.id) ?? null }))
    .filter((s) => s.ageDays === null || s.ageDays > STALE_DAYS);
}

/** Append a per-source table to the GitHub Actions step summary (no-op locally). */
function writeStepSummary(reports: IngestReport[]): void {
  const path = process.env.GITHUB_STEP_SUMMARY;
  if (!path) return;
  const ok = reports.filter((r) => r.status === "ok").length;
  const body = reports
    .map(
      (r) =>
        `| ${r.id} | ${r.status === "ok" ? "✅ ok" : "⚠️ warn"} | ${r.rows} | ${r.guard} | ${r.note ?? ""} |`,
    )
    .join("\n");
  const md = `### Ingest — ${ok}/${reports.length} ok\n\n| Fonte | Stato | Righe | Guard | Nota |\n|---|---|---|---|---|\n${body}\n`;
  try {
    appendFileSync(path, md);
  } catch (e) {
    console.warn("  ⚠ step summary write failed:", (e as Error).message);
  }
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  const force = argv.includes("--force");
  const ids = argv.filter((a) => !a.startsWith("--"));
  const adapters = selectAdapters(ids);
  if (!liveAdapters.length) {
    console.log("· no live adapters registered yet.");
    return 0;
  }
  if (!adapters.length) {
    console.log(`· no adapter matched [${ids.join(", ")}]. Registered: ${liveAdapters.map((a) => a.id).join(", ")}`);
    return 0;
  }
  console.log(`· ingesting ${adapters.length} source(s): ${adapters.map((a) => a.id).join(", ")}${force ? " (force: count-guard bypassed)" : ""}`);
  const reports = await runIngest(adapters, { force });
  await cleanupRateLimits(); // piggyback daily housekeeping on the ingest job
  writeStepSummary(reports);
  const ok = reports.filter((r) => r.status === "ok").length;
  const warned = reports.length - ok;
  console.log(`\n${warned === 0 ? "✓" : "⚠"} ingest complete — ${ok}/${reports.length} ok${warned ? ` · ${warned} a rischio` : ""}`);

  const stale = await findStale();
  if (stale.length) {
    const list = stale
      .map((s) => `${s.id} (${s.ageDays === null ? "mai" : `${Math.floor(s.ageDays)}g`})`)
      .join(", ");
    console.log(`⏳ dati obsoleti (> ${STALE_DAYS}g): ${list}`);
  }
  return warned === 0 && stale.length === 0 ? 0 : 1;
}

main()
  .then(async (code) => {
    await sql.end();
    process.exit(code);
  })
  .catch(async (e) => {
    console.error(e);
    await sql.end();
    process.exit(1);
  });
