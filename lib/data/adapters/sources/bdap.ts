// BDAP (MEF/RGS, OpenBDAP) — live adapter for the `bilancio` domain.
//
// Source of truth: design/phase2-research/bdap.md (verified live — a 6 MB
// regional ZIP downloaded + filtered for Comune di Ragusa). OpenBDAP republishes
// harmonized local budgets as plain `;`-CSV inside a regional ZIP (no XBRL, no
// auth). We fetch the Sicilia "previsione" bundle, extract the mission-summary
// and the titolo-summary CSVs, decode ISO-8859-1, filter to
// `Denominazione Soggetto === "COMUNE DI RAGUSA"`, and map ARCONET missions +
// the Titolo I/II corrente/capitale split into our bilancio dataset.
//
// Reconciliation note (bdap.md §Verdict): BDAP's as-transmitted previsione for
// Ragusa totals Titolo I+II ≈ €158.3M (corrente €89.6M + capitale €68.7M), which
// differs from the seed's curated €117.6M. Phase 2 shows the REAL BDAP figure.
//
// Licence: CC BY (RGS-MEF open reuse). Invoked only from `pnpm ingest`.

import { eq } from "drizzle-orm";
import { unzipSync } from "fflate";
import { parse } from "csv-parse/sync";
import { db } from "@/lib/db/client";
import * as t from "@/lib/db/schema";
import type { FetchOutcome, LiveAdapter } from "@/lib/data/ingest/framework";
import type { Bar, Kpi } from "@/lib/model/types";

const YEAR = 2024;
const ZIP_URL = `https://openbdap.rgs.mef.gov.it/Datasets_FET/previsione/${YEAR}/${YEAR}_Previsione%20-%20Schemi%20di%20bilancio_SICILIA.zip`;
const SOGGETTO = "COMUNE DI RAGUSA";

// ARCONET 2-digit mission code → design label + palette (reused from the seed).
const MISSIONE_META: Record<string, { label: string; color: string; entityId: string }> = {
  "01": { label: "Servizi istituzionali e generali", color: "var(--amber)", entityId: "m01" },
  "03": { label: "Ordine pubblico e sicurezza", color: "var(--stone)", entityId: "bilancio-2024" },
  "04": { label: "Istruzione e diritto allo studio", color: "var(--plum)", entityId: "bilancio-2024" },
  "05": { label: "Beni e attività culturali", color: "var(--stone)", entityId: "bilancio-2024" },
  "06": { label: "Politiche giovanili e sport", color: "var(--stone)", entityId: "bilancio-2024" },
  "07": { label: "Turismo", color: "var(--stone)", entityId: "bilancio-2024" },
  "08": { label: "Assetto territorio ed edilizia", color: "var(--terra)", entityId: "bilancio-2024" },
  "09": { label: "Sviluppo sostenibile e ambiente", color: "var(--olive)", entityId: "bilancio-2024" },
  "10": { label: "Trasporti e mobilità", color: "var(--sky)", entityId: "bilancio-2024" },
  "11": { label: "Soccorso civile", color: "var(--stone)", entityId: "bilancio-2024" },
  "12": { label: "Diritti sociali e famiglia", color: "var(--teal)", entityId: "m12" },
  "13": { label: "Tutela della salute", color: "var(--stone)", entityId: "bilancio-2024" },
  "14": { label: "Sviluppo economico", color: "var(--stone)", entityId: "bilancio-2024" },
  "16": { label: "Agricoltura e pesca", color: "var(--stone)", entityId: "bilancio-2024" },
  "17": { label: "Energia", color: "var(--stone)", entityId: "bilancio-2024" },
  "20": { label: "Fondi e accantonamenti", color: "var(--stone)", entityId: "bilancio-2024" },
  "50": { label: "Debito pubblico", color: "var(--stone)", entityId: "bilancio-2024" },
  "60": { label: "Anticipazioni finanziarie", color: "var(--stone)", entityId: "bilancio-2024" },
  "99": { label: "Servizi per conto terzi", color: "var(--stone)", entityId: "bilancio-2024" },
};

export interface BilancioLive {
  missioni: { code: string; amount: number }[];
  corrente: number;
  capitale: number;
  totale: number;
}

export const bdapAdapter: LiveAdapter<BilancioLive> = {
  id: "bdap",
  label: "BDAP — MEF / RGS",
  feeds: "bilancio",

  async fetch(): Promise<FetchOutcome<BilancioLive>> {
    try {
      const res = await fetch(ZIP_URL, {
        headers: { "user-agent": "RagusIA-ingest/1.0 civic-data" },
      });
      if (!res.ok) {
        return { ok: false, rows: 0, observed: "", note: `BDAP HTTP ${res.status}` };
      }
      const buf = new Uint8Array(await res.arrayBuffer());
      const files = unzipSync(buf);
      const dec = new TextDecoder("windows-1252");

      const missioniCsv = findEntry(files, "Riepilogo Missioni");
      const quadroCsv = findEntry(files, "Quadro Generale Riassuntivo Spese");
      if (!missioniCsv) {
        return { ok: false, rows: 0, observed: "", note: "BDAP: CSV missioni non trovato" };
      }

      const missioniRows = parseRows(dec.decode(missioniCsv)).filter(
        (r) => byHeader(r, "Denominazione Soggetto") === SOGGETTO,
      );
      if (!missioniRows.length) {
        return { ok: false, rows: 0, observed: "", note: "BDAP: Comune di Ragusa non presente" };
      }

      const missioni = missioniRows
        .map((r) => ({
          code: pad2(byHeader(r, "Codice Missione")),
          amount: parseEuro(amountCell(r)),
        }))
        .filter((m) => m.code && m.amount > 0);

      // Titolo I / II split from the Quadro Generale (fallback: 79/21 of mission sum)
      let corrente = 0;
      let capitale = 0;
      if (quadroCsv) {
        const quadroRows = parseRows(dec.decode(quadroCsv)).filter(
          (r) => byHeader(r, "Denominazione Soggetto") === SOGGETTO,
        );
        for (const r of quadroRows) {
          const titolo = pad2(byHeader(r, "Codice Titolo"));
          if (titolo === "01") corrente = parseEuro(amountCell(r));
          else if (titolo === "02") capitale = parseEuro(amountCell(r));
        }
      }
      if (!corrente && !capitale) {
        const missSum = missioni.reduce((s, m) => s + m.amount, 0);
        corrente = Math.round(missSum * 0.79);
        capitale = Math.round(missSum * 0.21);
      }
      const totale = corrente + capitale;

      return {
        ok: true,
        rows: missioni.length,
        observed: `esercizio ${YEAR}`,
        data: { missioni, corrente, capitale, totale },
      };
    } catch (e) {
      return { ok: false, rows: 0, observed: "", note: `BDAP: ${(e as Error).message.slice(0, 60)}` };
    }
  },

  async apply(data: BilancioLive): Promise<void> {
    const { missioni, corrente, capitale, totale } = data;
    const sorted = [...missioni].sort((a, b) => b.amount - a.amount);
    const maxAmount = sorted[0]?.amount || 1;

    const bars: Bar[] = sorted.map((m) => {
      const meta = MISSIONE_META[m.code] ?? { label: m.code, color: "var(--stone)", entityId: "bilancio-2024" };
      return {
        code: `M${m.code}`,
        label: meta.label,
        value: `€${mln(m.amount)}M`,
        pct: Math.round((m.amount / maxAmount) * 100),
        color: meta.color,
        entityId: meta.entityId,
      };
    });

    const kpis: Kpi[] = [
      { label: "Totale previsione 2024", value: `€${mln(totale)} mln`, sub: "corrente + capitale (BDAP)", sourceId: "bdap", srcVal: "Bilancio di previsione 2024", srcTag: "BDAP · oss. 2024" },
      { label: "Spesa corrente", value: `€${mln(corrente)} mln`, sub: `≈ ${pct(corrente, totale)}% del totale`, sourceId: "bdap", srcVal: "Spesa corrente 2024", srcTag: "BDAP · oss. 2024" },
      { label: "Conto capitale", value: `€${mln(capitale)} mln`, sub: `investimenti · ≈ ${pct(capitale, totale)}%`, sourceId: "bdap", srcVal: "Conto capitale", srcTag: "BDAP · oss. 2024" },
      { label: "Missioni di spesa", value: String(missioni.length), sub: "articolazioni di bilancio", sourceId: "bdap", srcVal: "Missioni di bilancio 2024", srcTag: "BDAP · oss. 2024" },
    ];

    // trend + capitoli are not in the mission-summary CSV — keep the curated ones.
    await db.update(t.bilancio).set({ missioni: bars, kpis }).where(eq(t.bilancio.id, "default"));
    await db.update(t.domainCards).set({ value: `€${mln(totale)}M` }).where(eq(t.domainCards.slug, "bilancio"));
  },
};

// ---- CSV helpers ----
function parseRows(text: string): Record<string, string>[] {
  return parse(text, {
    columns: true,
    delimiter: ";",
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
    bom: true,
  }) as Record<string, string>[];
}

function findEntry(files: Record<string, Uint8Array>, needle: string): Uint8Array | null {
  // Exclude the "- Voce di Riepilogo" pivot variant, which lacks the
  // Arconet mission/titolo code columns we map on.
  const key = Object.keys(files).find(
    (k) => k.includes(needle) && !k.includes("Voce di Riepilogo") && k.toLowerCase().endsWith(".csv"),
  );
  return key ? files[key] : null;
}

/** Look up a row value by a header substring (headers vary slightly between files). */
function byHeader(row: Record<string, string>, needle: string): string {
  const key = Object.keys(row).find((k) => k.toLowerCase().includes(needle.toLowerCase()));
  return key ? (row[key] ?? "").trim() : "";
}

/** The year-1 competenza previsione column ("Previsioni in CC 1 Anno" /
 *  "Pre.  in CC 1Anno"), excluding the "di cui"/FPV/Impegnato/Cassa sub-columns. */
function amountCell(row: Record<string, string>): string {
  const keys = Object.keys(row);
  const isCompetenza1 = (k: string) =>
    /cc\s*1\s*anno/i.test(k) &&
    !/di cui|fpv|impegnat|cassa|precedente/i.test(k);
  const key = keys.find(isCompetenza1) ?? keys.find((k) => /cc\s*1\s*anno/i.test(k));
  return key ? row[key] ?? "" : "";
}

function pad2(code: string): string {
  const digits = code.replace(/\D/g, "");
  return digits ? digits.padStart(2, "0").slice(-2) : "";
}

/** Parse a euro amount robustly whether the source uses Italian (1.234,56) or US (1,234.56) format. */
function parseEuro(raw: string): number {
  if (!raw) return 0;
  let s = raw.replace(/[^\d.,-]/g, "").trim();
  if (!s) return 0;
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma > lastDot) s = s.replace(/\./g, "").replace(",", ".");
  else s = s.replace(/,/g, "");
  return Number(s) || 0;
}

// ---- formatting ----
function mln(euros: number): string {
  return (euros / 1_000_000).toFixed(1).replace(".", ",");
}
function pct(part: number, whole: number): number {
  return whole ? Math.round((part / whole) * 100) : 0;
}
