// CLI: `pnpm ingest [sourceId ...]` (or no args / "all" for every registered adapter).
// Fetches live open data for the Comune di Ragusa, upserts it into Postgres, and
// updates each source's provenance/health. Sources without a live adapter are left
// on their seed data.
//
// Exit code: 0 only when every source ended `ok`. Any `warn` (a fetch failure or a
// count-guard block) exits non-zero so the scheduled GitHub Action fails and
// notifies — a degraded source must not pass silently. A forced run that ends
// all-`ok` still exits 0.
import { appendFileSync } from "node:fs";
import { sql } from "@/lib/db/client";
import { runIngest, type IngestReport } from "./framework";
import { liveAdapters, selectAdapters } from "./index";

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
  writeStepSummary(reports);
  const ok = reports.filter((r) => r.status === "ok").length;
  const warned = reports.length - ok;
  console.log(`\n${warned === 0 ? "✓" : "⚠"} ingest complete — ${ok}/${reports.length} ok${warned ? ` · ${warned} a rischio` : ""}`);
  return warned === 0 ? 0 : 1;
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
