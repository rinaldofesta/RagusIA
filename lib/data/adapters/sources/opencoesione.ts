// OpenCoesione — live adapter for the `opere` domain (cohesion-policy
// interventions: FESR/FSE/FSC, 2021-2027 programming cycle).
//
// Source of truth: design/phase2-research/opencoesione.md (verified live
// against the OpenCoesione JSON API, opencoesione.gov.it/it/api/). The
// pre-aggregated `aggregati/territori` endpoint gives count, total public
// cost, and the full status breakdown in a single call — no pagination
// needed, no client-side summing across the 116 projects.
//
// Verified live call (see opencoesione.md §"Step 3"):
//   GET /it/api/aggregati/territori/ragusa-comune.json?ciclo_programmazione=2021_2027
// -> { aggregati: { totali: { progetti: "116", costo_pubblico: "89102287,00" },
//                   stati_progetti: { non_avviato, in_corso, liquidato, concluso } } }
//
// Rate limit: OpenCoesione throttled to HTTP 429 after just 2-3 rapid
// sequential requests in the research pass (well under its documented
// 12 req/min anonymous cap). This adapter makes exactly ONE request, so no
// spacing/backoff is needed here — but it must never throw on 429/network
// errors, returning `{ok:false, ...}` instead so the orchestrator preserves
// the last-good data and flips the source to "warn" (per framework.ts).
//
// This is only ever invoked from the `pnpm ingest` script (never from a
// request path) — see lib/data/ingest/framework.ts.

import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import * as t from "@/lib/db/schema";
import { fetchJson, type FetchOutcome, type LiveAdapter } from "@/lib/data/ingest/framework";
import { itNum, mln } from "@/lib/format";

const TERRITORIO = "ragusa-comune";
const CICLO = "2021_2027";
const URL = `https://opencoesione.gov.it/it/api/aggregati/territori/${TERRITORIO}.json?ciclo_programmazione=${CICLO}`;

export interface CoesioneStatus {
  non_avviato: number;
  in_corso: number;
  liquidato: number;
  concluso: number;
}

export interface CoesioneData {
  interventi: number;
  valoreEuro: number;
  status: CoesioneStatus;
}

// ---- OpenCoesione `aggregati/territori` JSON shape (fields we need) ----
export interface AggregatiResponse {
  aggregati: {
    totali: {
      progetti: string;
      costo_pubblico: string;
    };
    stati_progetti: {
      non_avviato?: { totali: { progetti: string } };
      in_corso?: { totali: { progetti: string } };
      liquidato?: { totali: { progetti: string } };
      concluso?: { totali: { progetti: string } };
    };
  };
}

export function toInt(s: string | undefined): number {
  if (!s) return 0;
  return Math.round(Number(s.replace(",", ".")));
}

/** Parse the pre-aggregated `aggregati/territori` payload into normalized
 *  cohesion figures. Pure — returns null when the shape is missing or empty
 *  (rate-limited/unreachable), which fetch() maps to a `warn`. */
export function parseCoesione(msg: AggregatiResponse): CoesioneData | null {
  const totali = msg?.aggregati?.totali;
  const stati = msg?.aggregati?.stati_progetti;
  if (!totali || !stati) return null;
  const interventi = toInt(totali.progetti);
  if (!interventi) return null;
  return {
    interventi,
    valoreEuro: toInt(totali.costo_pubblico),
    status: {
      non_avviato: toInt(stati.non_avviato?.totali.progetti),
      in_corso: toInt(stati.in_corso?.totali.progetti),
      liquidato: toInt(stati.liquidato?.totali.progetti),
      concluso: toInt(stati.concluso?.totali.progetti),
    },
  };
}

export const opencoesioneAdapter: LiveAdapter<CoesioneData> = {
  id: "opencoesione",
  label: "OpenCoesione — Dip. Coesione",
  feeds: "opere/coesione",

  async fetch(): Promise<FetchOutcome<CoesioneData>> {
    try {
      const msg = await fetchJson<AggregatiResponse>(URL, {
        headers: { accept: "application/json" },
      });

      const data = parseCoesione(msg);
      if (!data) {
        return { ok: false, rows: 0, observed: "", note: "OpenCoesione rate limit / non raggiungibile" };
      }

      return {
        ok: true,
        rows: data.interventi,
        observed: "2021–2027",
        data,
      };
    } catch {
      return { ok: false, rows: 0, observed: "", note: "OpenCoesione rate limit / non raggiungibile" };
    }
  },

  async apply(data: CoesioneData): Promise<void> {
    const { interventi, valoreEuro, status } = data;

    const kpis = [
      { label: "Interventi", value: itNum(interventi), sub: "coesione 2021–2027" },
      { label: "Valore", value: `€${mln(valoreEuro)}M`, sub: "costo pubblico" },
      { label: "In corso", value: String(status.in_corso), sub: "in attuazione" },
      { label: "Conclusi", value: String(status.concluso + status.liquidato), sub: "liquidati/conclusi" },
    ];

    const conclusiLiquidati = status.concluso + status.liquidato;
    const max = Math.max(conclusiLiquidati, status.in_corso, status.non_avviato) || 1;
    const pct = (v: number) => Math.round((v / max) * 100);

    const chart = {
      title: "Interventi per stato di avanzamento",
      srcTag: "OpenCoesione · CC-BY",
      sourceId: "opencoesione",
      srcVal: "Interventi per stato",
      bars: [
        { label: "Conclusi/liquidati", value: String(conclusiLiquidati), pct: pct(conclusiLiquidati), color: "var(--teal)" },
        { label: "In corso", value: String(status.in_corso), pct: pct(status.in_corso), color: "var(--amber)" },
        { label: "Non avviati", value: String(status.non_avviato), pct: pct(status.non_avviato), color: "var(--stone)" },
      ],
    };

    await db
      .update(t.domainDetails)
      .set({ kpis, chart })
      .where(eq(t.domainDetails.slug, "opere"));

    // Query substrate: coesione interventi per stato as flat rows.
    await db.delete(t.factCoesione).where(eq(t.factCoesione.sourceId, "opencoesione"));
    const factRows = [
      { stato: "non avviato", progetti: status.non_avviato, sourceId: "opencoesione" },
      { stato: "in corso", progetti: status.in_corso, sourceId: "opencoesione" },
      { stato: "liquidato", progetti: status.liquidato, sourceId: "opencoesione" },
      { stato: "concluso", progetti: status.concluso, sourceId: "opencoesione" },
    ].filter((r) => r.progetti > 0);
    if (factRows.length) await db.insert(t.factCoesione).values(factRows).onConflictDoNothing();
  },
};
