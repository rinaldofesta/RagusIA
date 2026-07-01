// OpenPNRR (Fondazione Openpolis) — live adapter for the `pnrr` domain.
//
// Source of truth: design/phase2-research/openpnrr.md (verified live against
// openpnrr.it/api/v1/). Flow: resolve the comune's internal territorio id from
// its ISTAT code, count total projects, count per missione via the verified
// `missione__codice_identificativo` filter, and sum financing over SINGLE-comune
// projects only (multi-territorio projects — 11% — carry national totals that
// inflate the euro figure ~12×, so they're counted but excluded from the € KPI).
//
// Licence: ODbL 1.0 (share-alike). CORS-open, no auth, no rate limit observed.
// Invoked only from `pnpm ingest` (never a request path).

import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import * as t from "@/lib/db/schema";
import { fetchJson, type FetchOutcome, type LiveAdapter } from "@/lib/data/ingest/framework";

const BASE = "https://openpnrr.it/api/v1";
const ISTAT = "088009";

const MISSIONI: { code: keyof PnrrData["perMissione"]; label: string }[] = [
  { code: "M1", label: "M1 · Digitalizzazione" },
  { code: "M2", label: "M2 · Transizione ecologica" },
  { code: "M3", label: "M3 · Mobilità sostenibile" },
  { code: "M4", label: "M4 · Istruzione e ricerca" },
  { code: "M5", label: "M5 · Inclusione e coesione" },
  { code: "M6", label: "M6 · Salute" },
];
// descending-rank colours (design palette)
const COLORS = ["var(--amber)", "var(--teal)", "var(--olive)", "var(--terra)", "var(--sky)", "var(--stone)"];

export interface PnrrData {
  total: number;
  perMissione: { M1: number; M2: number; M3: number; M4: number; M5: number; M6: number };
  valoreEuroSingle: number;
}

interface Paged<T> {
  count: number;
  next: string | null;
  results: T[];
}
interface Territorio {
  id: number;
  istat_id: string;
}
interface Progetto {
  finanziamento_totale: string | null;
  territori: string[];
}

async function countFor(territorioId: number, missione?: string): Promise<number> {
  const q = new URLSearchParams({ territori: String(territorioId), page_size: "1" });
  if (missione) q.set("missione__codice_identificativo", missione.toLowerCase());
  const page = await fetchJson<Paged<unknown>>(`${BASE}/progetti?${q.toString()}`, {
    headers: { accept: "application/json" },
  });
  return page.count ?? 0;
}

export const openpnrrAdapter: LiveAdapter<PnrrData> = {
  id: "openpnrr",
  label: "OpenPNRR — Fondazione Openpolis",
  feeds: "pnrr",

  async fetch(): Promise<FetchOutcome<PnrrData>> {
    try {
      // 1. resolve territorio id from ISTAT code
      const terr = await fetchJson<Paged<Territorio>>(
        `${BASE}/territori?istat_id=${ISTAT}`,
        { headers: { accept: "application/json" } },
      );
      const territorioId = terr.results?.[0]?.id;
      if (!territorioId) {
        return { ok: false, rows: 0, observed: "", note: "OpenPNRR: territorio non risolto" };
      }

      // 2. per-missione counts (6 calls) — total is their sum plus any M7 remainder
      const perMissione = { M1: 0, M2: 0, M3: 0, M4: 0, M5: 0, M6: 0 };
      for (const m of MISSIONI) {
        perMissione[m.code] = await countFor(territorioId, m.code);
      }
      const total = await countFor(territorioId);

      // 3. financing over single-comune projects only (one paged dump)
      const dump = await fetchJson<Paged<Progetto>>(
        `${BASE}/progetti?territori=${territorioId}&page_size=1000`,
        { headers: { accept: "application/json" } },
      );
      const valoreEuroSingle = (dump.results ?? [])
        .filter((p) => Array.isArray(p.territori) && p.territori.length === 1)
        .reduce((sum, p) => sum + (Number(p.finanziamento_totale) || 0), 0);

      return {
        ok: true,
        rows: total,
        observed: "2021–2026",
        data: { total, perMissione, valoreEuroSingle },
      };
    } catch (e) {
      return { ok: false, rows: 0, observed: "", note: `OpenPNRR: ${(e as Error).message.slice(0, 60)}` };
    }
  },

  async apply(data: PnrrData): Promise<void> {
    const { total, perMissione, valoreEuroSingle } = data;

    const bars = MISSIONI.map((m) => ({ label: m.label, count: perMissione[m.code] }))
      .sort((a, b) => b.count - a.count);
    const maxCount = bars[0]?.count || 1;
    const chartBars = bars.map((b, i) => ({
      label: b.label,
      value: String(b.count),
      pct: Math.round((b.count / maxCount) * 100),
      color: COLORS[i] ?? "var(--stone)",
    }));
    const missioniAttive = MISSIONI.filter((m) => perMissione[m.code] > 0).length;

    const kpis = [
      { label: "Progetti PNRR", value: itNum(total), sub: "localizzati a Ragusa" },
      { label: "Coesione", value: "116", sub: "interventi FESR/FSE/FSC" },
      { label: "Valore PNRR", value: `≈ €${mln(valoreEuroSingle)}M`, sub: "finanziamento (single-comune)" },
      { label: "Missioni", value: String(missioniAttive), sub: "attive sul territorio" },
    ];

    const chart = {
      title: "Progetti PNRR per missione",
      srcTag: "OpenPNRR · ODbL",
      sourceId: "openpnrr",
      srcVal: "PNRR per missione",
      bars: chartBars,
    };

    await db.update(t.domainDetails).set({ kpis, chart }).where(eq(t.domainDetails.slug, "pnrr"));
    await db
      .update(t.domainCards)
      .set({ value: itNum(total + 116), sub: `${itNum(total)} PNRR · 116 coesione` })
      .where(eq(t.domainCards.slug, "pnrr"));
  },
};

// ---- formatting helpers ----
function itNum(n: number): string {
  return Math.round(n).toLocaleString("it-IT");
}
function mln(euros: number): string {
  return (euros / 1_000_000).toFixed(1).replace(".", ",");
}
