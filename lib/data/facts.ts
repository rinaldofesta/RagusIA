// Baseline projection of the seed domain data into the flat "fact" tables that
// back the NL→SQL engine (lib/query). Live adapters overwrite their own slice
// with real numbers on ingest; this makes the engine work before any ingest and
// gives it a curated fallback. Called from lib/db/seed.ts.

import { db } from "@/lib/db/client";
import * as t from "@/lib/db/schema";
import * as seed from "@/lib/data/seed";

/** "€29,8M" / "€117,6 mln" → 29_800_000 / 117_600_000 */
function euroMln(s: string): number {
  const cleaned = s.replace(/[€\s]/g, "").replace(/mln/gi, "").replace(/M$/i, "").replace(",", ".");
  return Math.round((parseFloat(cleaned) || 0) * 1_000_000);
}
/** "€480.000" / "€2.140.000" → 480000 / 2140000 */
function euroAmount(s: string): number {
  const cleaned = s.replace(/[€\s]/g, "").replace(/\./g, "").replace(",", ".");
  return Math.round(parseFloat(cleaned) || 0);
}
/** "148" / "3.910" → 148 / 3910 */
function intLoose(s: string): number {
  return parseInt(s.replace(/\D/g, ""), 10) || 0;
}

export async function seedFacts(): Promise<void> {
  await db.delete(t.factContracts);
  await db.delete(t.factBudget);
  await db.delete(t.factPnrr);
  await db.delete(t.factCoesione);

  // Bilancio → fact_budget (curated seed missioni)
  const budget = seed.bilancio.missioni.map((m) => ({
    id: `2024:${m.code}`,
    missioneCode: m.code ?? "—",
    missioneLabel: m.label,
    importo: euroMln(m.value),
    anno: 2024,
    sourceId: "bdap",
  }));
  if (budget.length) await db.insert(t.factBudget).values(budget).onConflictDoNothing();

  // PNRR → fact_pnrr (curated seed chart bars, e.g. "M4 · Istruzione e ricerca" / "148")
  const pnrrBars = seed.domainDetails.pnrr?.chart?.bars ?? [];
  const pnrr = pnrrBars.map((b) => ({
    missioneCode: b.label.split("·")[0].trim(),
    missioneLabel: b.label,
    progetti: intLoose(b.value),
    sourceId: "openpnrr",
  }));
  if (pnrr.length) await db.insert(t.factPnrr).values(pnrr).onConflictDoNothing();

  // Opere/coesione → fact_coesione (curated seed chart bars)
  const opereBars = seed.domainDetails.opere?.chart?.bars ?? [];
  const coesione = opereBars.map((b) => ({
    stato: b.label,
    progetti: intLoose(b.value),
    sourceId: "opencoesione",
  }));
  if (coesione.length) await db.insert(t.factCoesione).values(coesione).onConflictDoNothing();

  // Appalti → fact_contracts (curated seed recent contracts; tipologia unknown in seed)
  const contracts = seed.appalti.contratti.map((c) => ({
    cig: c.cig,
    oggetto: c.ogg,
    importo: euroAmount(c.imp),
    tipologia: "—",
    ufficio: c.uff,
    anno: /(\d{4})$/.exec(c.data)?.[1] ? Number(/(\d{4})$/.exec(c.data)![1]) : null,
    data: c.data,
    sourceId: "anac",
  }));
  if (contracts.length) await db.insert(t.factContracts).values(contracts).onConflictDoNothing();
}
