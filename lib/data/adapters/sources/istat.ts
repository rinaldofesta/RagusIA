// ISTAT — SDMX-JSON live adapter for the `demografia` domain.
//
// Source of truth: design/phase2-research/istat.md (verified live against the
// ISTAT SDMX REST API, esploradati.istat.it). Three dataflow calls are needed:
//   1. 22_289  (DCIS_POPRES1)          — resident population, 1 Jan
//   2. 29_7    (DCIS_POPSTRRES1)       — foreign residents, 1 Jan
//   3. DF_DCSS_POP_DEMCITMIG_TV_1      — resident population by 5-year age bracket
//
// Ragusa's REF_AREA/ITTER107 code is the stable comune code 088009.
// Superficie (km²) is NOT queryable via any ISTAT SDMX dataflow (checked in
// the research run) — it is hardcoded as a static constant per istat.md's
// explicit recommendation.
//
// Rate limit: ISTAT throttles at ~5 req/min per IP and can block an IP for
// 1-2 days once tripped (per istat.md). The 3 requests below are spaced
// ~1500ms apart to stay well under that limit. This adapter is only ever
// invoked from the `pnpm ingest` script (never from a request path).

import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import * as t from "@/lib/db/schema";
import { curlJson, type FetchOutcome, type LiveAdapter } from "@/lib/data/ingest/framework";

const BASE = "https://esploradati.istat.it/SDMXWS/rest/data";
const REF_AREA = "088009"; // Ragusa
const SUPERFICIE_KMQ = 444.67;
const SLEEP_MS = 1500;

export interface IstatData {
  residenti: number;
  residentiYear: string;
  stima: number;
  stimaYear: string;
  stranieriPct: number;
  g0_14: number;
  g15_64: number;
  g65: number;
  superficieKmq: number;
}

// ---- SDMX-JSON (compact, `Accept: application/json`) minimal shape ----
// The SDMX-JSON data message nests observations under
// `data.dataSets[0].series["<dim-indices-joined-by-colon>"].observations["<obs-index>"]`
// and resolves the dimension index → human key via
// `data.structure.dimensions.series[i].values[valueIndex].id` (for series-level
// dimensions) and `data.structure.dimensions.observation[0].values[obsIndex].id`
// (for the time dimension, the only observation-level dimension in these flows).
interface SdmxStructure {
  dimensions: {
    series: { id: string; values: { id: string; name?: string }[] }[];
    observation: { id: string; values: { id: string; name?: string }[] }[];
  };
}
interface SdmxDataSet {
  series: Record<string, { observations: Record<string, (number | null)[]> }>;
}
// ISTAT's `Accept: application/json` returns SDMX-JSON 1.0 with `structure` and
// `dataSets` at the ROOT. (SDMX-JSON 2.0 nests them under `data`/`structures`.)
// Support both shapes defensively.
interface SdmxJsonMessage {
  structure?: SdmxStructure;
  structures?: SdmxStructure[];
  dataSets?: SdmxDataSet[];
  data?: { structure?: SdmxStructure; structures?: SdmxStructure[]; dataSets?: SdmxDataSet[] };
}

interface ParsedObs {
  seriesDims: Record<string, string>;
  time: string;
  value: number;
  provisional: boolean; // SDMX obs with an extra attribute element = provvisorio/stima
}

/** Flatten every observation across every series in an SDMX-JSON compact message. */
function parseSdmxJson(msg: SdmxJsonMessage): ParsedObs[] {
  const out: ParsedObs[] = [];
  const structure =
    msg.structure ?? msg.structures?.[0] ?? msg.data?.structure ?? msg.data?.structures?.[0];
  const dataSets = msg.dataSets ?? msg.data?.dataSets;
  if (!structure || !dataSets) return out;

  const seriesDimDefs = structure.dimensions.series;
  const obsDimDefs = structure.dimensions.observation;
  const timeDim = obsDimDefs[0]; // TIME_PERIOD is always the sole observation dimension here

  for (const ds of dataSets) {
    for (const [seriesKey, series] of Object.entries(ds.series)) {
      const idx = seriesKey.split(":").map(Number);
      const seriesDims: Record<string, string> = {};
      seriesDimDefs.forEach((dimDef, i) => {
        const val = dimDef.values[idx[i]];
        if (val) seriesDims[dimDef.id] = val.id;
      });
      for (const [obsIdxStr, obsArr] of Object.entries(series.observations)) {
        const obsIdx = Number(obsIdxStr);
        const timeVal = timeDim.values[obsIdx];
        const value = obsArr[0];
        if (timeVal && value !== null && value !== undefined) {
          out.push({ seriesDims, time: timeVal.id, value, provisional: obsArr.length > 1 });
        }
      }
    }
  }
  return out;
}

/** Pick the observation with the highest TIME_PERIOD from a flat obs list. */
function latest(obs: ParsedObs[]): ParsedObs | undefined {
  return obs.slice().sort((a, b) => b.time.localeCompare(a.time))[0];
}

/** Latest DEFINITIVE (non-provisional) observation — the last official 1-Jan figure. */
function latestDefinitive(obs: ParsedObs[]): ParsedObs | undefined {
  const def = obs.filter((o) => !o.provisional);
  return latest(def.length ? def : obs);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const AGE_BRACKETS_0_14 = ["Y_UN4", "Y5-9", "Y10-14"];
const AGE_BRACKETS_15_64 = [
  "Y15-19",
  "Y20-24",
  "Y25-29",
  "Y30-34",
  "Y35-39",
  "Y40-44",
  "Y45-49",
  "Y50-54",
  "Y55-59",
  "Y60-64",
];
const AGE_BRACKETS_65_PLUS = [
  "Y65-69",
  "Y70-74",
  "Y75-79",
  "Y80-84",
  "Y85-89",
  "Y90-94",
  "Y95-99",
  "Y_GE100",
];

async function fetchPopulation(): Promise<ParsedObs[]> {
  const url = `${BASE}/22_289/A.${REF_AREA}.JAN.9.TOTAL.99?startPeriod=2023`;
  const msg = await curlJson<SdmxJsonMessage>(url);
  return parseSdmxJson(msg);
}

async function fetchForeignResidents(): Promise<ParsedObs | undefined> {
  const url = `${BASE}/29_7/A.${REF_AREA}.JAN.9.TOTAL?startPeriod=2023`;
  const msg = await curlJson<SdmxJsonMessage>(url);
  return latestDefinitive(parseSdmxJson(msg));
}

async function fetchAgeStructure(): Promise<ParsedObs[]> {
  const url = `${BASE}/DF_DCSS_POP_DEMCITMIG_TV_1/A.${REF_AREA}.RESPOP_AV........?lastNObservations=1`;
  const msg = await curlJson<SdmxJsonMessage>(url);
  const all = parseSdmxJson(msg);
  // GENDER=T (total) rows only, per istat.md.
  return all.filter((o) => o.seriesDims.GENDER === "T");
}

function sumBrackets(obs: ParsedObs[], brackets: string[]): number {
  return obs
    .filter((o) => brackets.includes(o.seriesDims.AGE_CLASS))
    .reduce((sum, o) => sum + o.value, 0);
}

export const istatAdapter: LiveAdapter<IstatData> = {
  id: "istat",
  label: "ISTAT — IstatData (SDMX)",
  feeds: "demografia",

  async fetch(): Promise<FetchOutcome<IstatData>> {
    try {
      // 1. Resident population — the last DEFINITIVE 1-Jan figure (osservato)
      //    and the latest overall (the pre-censuaria stima, flagged provvisorio).
      const popObs = await fetchPopulation();
      const osservato = latestDefinitive(popObs);
      const stimaObs = latest(popObs);
      if (!osservato || !stimaObs) {
        return { ok: false, rows: 0, observed: "", note: "ISTAT non raggiungibile (rate limit?)" };
      }
      await sleep(SLEEP_MS);

      // 2. Foreign residents (same period as population for a consistent %).
      const foreignObs = await fetchForeignResidents();
      if (!foreignObs) {
        return { ok: false, rows: 0, observed: "", note: "ISTAT non raggiungibile (rate limit?)" };
      }
      await sleep(SLEEP_MS);

      // 3. Age structure by 5-year bracket.
      const ageObs = await fetchAgeStructure();
      if (!ageObs.length) {
        return { ok: false, rows: 0, observed: "", note: "ISTAT non raggiungibile (rate limit?)" };
      }

      const residenti = osservato.value;
      const stranieriPct = (foreignObs.value / residenti) * 100;

      const totalAge = sumBrackets(ageObs, [
        ...AGE_BRACKETS_0_14,
        ...AGE_BRACKETS_15_64,
        ...AGE_BRACKETS_65_PLUS,
      ]);
      if (!totalAge) {
        return { ok: false, rows: 0, observed: "", note: "ISTAT non raggiungibile (rate limit?)" };
      }

      const g0_14 = (sumBrackets(ageObs, AGE_BRACKETS_0_14) / totalAge) * 100;
      const g15_64 = (sumBrackets(ageObs, AGE_BRACKETS_15_64) / totalAge) * 100;
      const g65 = (sumBrackets(ageObs, AGE_BRACKETS_65_PLUS) / totalAge) * 100;

      const rows = popObs.length + 1 /* foreign */ + ageObs.length;

      return {
        ok: true,
        rows,
        observed: `01/01/${osservato.time}`,
        data: {
          residenti,
          residentiYear: osservato.time,
          stima: stimaObs.value,
          stimaYear: stimaObs.time,
          stranieriPct,
          g0_14,
          g15_64,
          g65,
          superficieKmq: SUPERFICIE_KMQ,
        },
      };
    } catch {
      return { ok: false, rows: 0, observed: "", note: "ISTAT non raggiungibile (rate limit?)" };
    }
  },

  async apply(data: IstatData): Promise<void> {
    const { residenti, residentiYear, stima, stimaYear, stranieriPct, g0_14, g15_64, g65 } = data;

    const kpis = [
      { label: "Residenti", value: itNum(residenti), sub: `al 1/1/${residentiYear}` },
      { label: "Stranieri", value: itPct(stranieriPct), sub: "della popolazione" },
      { label: `Stima ${stimaYear}`, value: itNum(stima), sub: "pre-censuaria" },
      { label: "Superficie", value: "444,67 km²", sub: "la più vasta della provincia" },
    ];

    const chart = {
      title: "Struttura per età",
      srcTag: "ISTAT · CC-BY",
      sourceId: "istat",
      srcVal: "Struttura per età",
      bars: [
        { label: "15–64 anni (attivi)", value: itPct(g15_64), pct: 100, color: "var(--teal)" },
        {
          label: "65+ anni (anziani)",
          value: itPct(g65),
          pct: Math.round((g65 / g15_64) * 100),
          color: "var(--amber)",
        },
        {
          label: "0–14 anni (giovani)",
          value: itPct(g0_14),
          pct: Math.round((g0_14 / g15_64) * 100),
          color: "var(--olive)",
        },
      ],
    };

    await db
      .update(t.domainDetails)
      .set({ kpis, chart })
      .where(eq(t.domainDetails.slug, "demografia"));

    await db
      .update(t.domainCards)
      .set({ value: itNum(residenti), sub: `residenti (1/1/${residentiYear})` })
      .where(eq(t.domainCards.slug, "demografia"));
  },
};

// ---- formatting helpers ----

/** Italian thousands separator: 73878 -> "73.878". */
function itNum(n: number): string {
  return Math.round(n).toLocaleString("it-IT");
}

/** One-decimal Italian percentage: 9.64 -> "9,6%". */
function itPct(p: number): string {
  return `${p.toFixed(1).replace(".", ",")}%`;
}
