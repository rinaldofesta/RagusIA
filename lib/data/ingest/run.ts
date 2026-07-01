// CLI: `pnpm ingest [sourceId ...]` (or no args / "all" for every registered adapter).
// Fetches live open data for the Comune di Ragusa, upserts it into Postgres, and
// updates each source's provenance/health. Sources without a live adapter are left
// on their seed data.
import { sql } from "@/lib/db/client";
import { runIngest } from "./framework";
import { liveAdapters, selectAdapters } from "./index";

async function main() {
  const ids = process.argv.slice(2);
  const adapters = selectAdapters(ids);
  if (!liveAdapters.length) {
    console.log("· no live adapters registered yet.");
    return;
  }
  if (!adapters.length) {
    console.log(`· no adapter matched [${ids.join(", ")}]. Registered: ${liveAdapters.map((a) => a.id).join(", ")}`);
    return;
  }
  console.log(`· ingesting ${adapters.length} source(s): ${adapters.map((a) => a.id).join(", ")}`);
  const reports = await runIngest(adapters);
  const ok = reports.filter((r) => r.status === "ok").length;
  console.log(`\n${ok === reports.length ? "✓" : "⚠"} ingest complete — ${ok}/${reports.length} ok`);
}

main()
  .then(() => sql.end())
  .catch(async (e) => {
    console.error(e);
    await sql.end();
    process.exit(1);
  });
