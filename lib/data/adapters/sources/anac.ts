// ANAC — live adapter for the `appalti` domain (public contracts of the
// Comune di Ragusa).
//
// Source of truth: design/phase2-research/anac.md. ANAC has no per-comune API
// (the portal is WAF-protected and the data is bulk national monthly files).
// We download the `cig-YYYY` monthly CSV zips for a bounded year window and
// filter `cf_amministrazione_appaltante == 00180270886` client-side. This yields
// real contracts (oggetto, importo, tipologia, ufficio, date). The winner
// (aggiudicatario) lives in a separate 758 MB national file with no CF field and
// is intentionally omitted — the design already labels operator names illustrative.
//
// Heavy, occasional batch job (~75 MB/year) — ingest-time only, never a request
// path. WAF-sensitive → downloads go through curl (see framework curlBuffer).

import { eq } from "drizzle-orm";
import { unzipSync, strFromU8 } from "fflate";
import { parse } from "csv-parse/sync";
import { db } from "@/lib/db/client";
import * as t from "@/lib/db/schema";
import { curlBuffer, type FetchOutcome, type LiveAdapter } from "@/lib/data/ingest/framework";
import { itNum, euro, euroMln, fmtMonth } from "@/lib/format";
import type { AppaltiData, Bar, ContrattoRow, Kpi } from "@/lib/model/types";

const CF_RAGUSA = "00180270886";
// Bounded window (override with ANAC_YEARS="2023,2024,2025"). ANAC data is
// bulk-national, ~75 MB/year — keep the default small.
const YEARS = (process.env.ANAC_YEARS ?? "2024,2025").split(",").map((s) => s.trim()).filter(Boolean);
const ZIP = (year: string, mm: string) =>
  `https://dati.anticorruzione.it/opendata/download/dataset/cig-${year}/filesystem/cig_csv_${year}_${mm}.zip`;

interface AnacContract {
  cig: string;
  oggetto: string;
  importo: number;
  tipologia: string; // LAVORI | SERVIZI | FORNITURE
  ufficio: string;
  data: string; // yyyy-mm-dd
}

export interface AnacData {
  contratti: AnacContract[];
}

const TIPO_COLORS = ["var(--amber)", "var(--teal)", "var(--terra)", "var(--olive)"];
const UFF_COLORS = ["var(--amber)", "var(--teal)", "var(--terra)", "var(--olive)", "var(--sky)", "var(--stone)"];

function col(row: Record<string, string>, name: string): string {
  return (row[name] ?? "").trim();
}

async function fetchMonth(year: string, mm: string): Promise<AnacContract[]> {
  const bytes = await curlBuffer(ZIP(year, mm), 180);
  const files = unzipSync(bytes);
  const csvKey = Object.keys(files).find((k) => k.toLowerCase().endsWith(".csv"));
  if (!csvKey) return [];
  const rows = parse(strFromU8(files[csvKey]), {
    columns: true,
    delimiter: ";",
    skip_empty_lines: true,
    relax_column_count: true,
    relax_quotes: true,
    trim: true,
    bom: true,
  }) as Record<string, string>[];

  const out: AnacContract[] = [];
  for (const r of rows) {
    if (col(r, "cf_amministrazione_appaltante") !== CF_RAGUSA) continue;
    const importo = Number(col(r, "importo_lotto") || col(r, "importo_complessivo_gara")) || 0;
    out.push({
      cig: col(r, "cig"),
      oggetto: col(r, "oggetto_lotto") || col(r, "oggetto_gara"),
      importo,
      tipologia: col(r, "oggetto_principale_contratto") || "ALTRO",
      ufficio: col(r, "denominazione_centro_costo") || "—",
      data: col(r, "data_pubblicazione"),
    });
  }
  return out;
}

export const anacAdapter: LiveAdapter<AnacData> = {
  id: "anac",
  label: "ANAC — Autorità Anticorruzione",
  feeds: "appalti",

  async fetch(): Promise<FetchOutcome<AnacData>> {
    const byCig = new Map<string, AnacContract>();
    let anyMonth = false;
    for (const year of YEARS) {
      for (let m = 1; m <= 12; m++) {
        const mm = String(m).padStart(2, "0");
        try {
          const rows = await fetchMonth(year, mm);
          anyMonth = true;
          for (const c of rows) if (c.cig && !byCig.has(c.cig)) byCig.set(c.cig, c);
        } catch {
          // month missing (e.g. future months) or transient — skip.
        }
      }
    }
    if (!anyMonth) {
      return { ok: false, rows: 0, observed: "", note: "ANAC non raggiungibile (WAF/rete)" };
    }
    const contratti = [...byCig.values()];
    if (!contratti.length) {
      return { ok: false, rows: 0, observed: "", note: "ANAC: nessun contratto per Ragusa nel periodo" };
    }
    return {
      ok: true,
      rows: contratti.length,
      observed: YEARS.length > 1 ? `${YEARS[0]}–${YEARS[YEARS.length - 1]}` : YEARS[0],
      data: { contratti },
    };
  },

  async apply(data: AnacData): Promise<void> {
    const { contratti } = data;
    const totalValue = contratti.reduce((s, c) => s + c.importo, 0);
    const n = contratti.length;
    const avg = n ? totalValue / n : 0;
    const uffici = new Set(contratti.map((c) => c.ufficio).filter((u) => u && u !== "—"));

    // Panel A — per tipologia (Lavori/Servizi/Forniture) by summed value.
    const perTipo = groupSum(contratti, (c) => titleCase(c.tipologia));
    const tipoBars: Bar[] = toBars(perTipo, TIPO_COLORS);

    // Panel B — per ufficio committente by summed value.
    const perUff = groupSum(contratti, (c) => c.ufficio);
    const uffBars: Bar[] = toBars(perUff, UFF_COLORS).slice(0, 6);

    // Recent contracts — most recent by date, top 6.
    const recent = [...contratti]
      .sort((a, b) => (b.data || "").localeCompare(a.data || ""))
      .slice(0, 6);
    const contrattiRows: ContrattoRow[] = recent.map((c) => ({
      cig: c.cig,
      ogg: c.oggetto.length > 60 ? c.oggetto.slice(0, 58) + "…" : c.oggetto,
      imp: euro(c.importo),
      op: titleCase(c.tipologia), // tipologia in the "operatore" slot (winners not ingested)
      entityId: "", // no operator entity — table renders as plain text
      uff: c.ufficio,
      data: fmtMonth(c.data),
    }));

    const kpis: Kpi[] = [
      { label: "Contratti pubblicati", value: itNum(n), sub: `CIG ${observedLabel()}`, sourceId: "anac", srcVal: `Contratti · ${n}`, srcTag: "ANAC · CC-BY", status: "ok" },
      { label: "Valore complessivo", value: euroMln(totalValue), sub: "importo a base di gara", sourceId: "anac", srcVal: `Valore · ${euro(totalValue)}`, srcTag: "ANAC · CC-BY", status: "ok" },
      { label: "Importo medio", value: euro(Math.round(avg)), sub: "per contratto", sourceId: "anac", srcVal: `Importo medio · ${euro(Math.round(avg))}`, srcTag: "ANAC · CC-BY", status: "ok" },
      { label: "Uffici committenti", value: itNum(uffici.size), sub: "centri di costo", sourceId: "anac", srcVal: `Uffici · ${uffici.size}`, srcTag: "ANAC · CC-BY", status: "ok" },
    ];

    const appalti: AppaltiData = {
      kpis,
      operatori: tipoBars, // panel heading relabelled to "per tipologia" in the page
      uffici: uffBars,
      contratti: contrattiRows,
    };

    await db.update(t.appalti).set(appalti).where(eq(t.appalti.id, "default"));
    await db
      .update(t.domainCards)
      .set({ value: euroMln(totalValue), sub: `${itNum(n)} contratti · ${observedLabel()}` })
      .where(eq(t.domainCards.slug, "appalti"));

    // Query substrate: all contracts as flat rows (for the NL→SQL engine).
    await db.delete(t.factContracts).where(eq(t.factContracts.sourceId, "anac"));
    if (contratti.length) {
      const rows = contratti.map((c) => ({
        cig: c.cig,
        oggetto: c.oggetto,
        importo: c.importo,
        tipologia: titleCase(c.tipologia),
        ufficio: c.ufficio,
        anno: /^(\d{4})/.exec(c.data)?.[1] ? Number(/^(\d{4})/.exec(c.data)![1]) : null,
        data: c.data,
        sourceId: "anac",
      }));
      // chunked insert (dedup by cig already done in fetch)
      for (let i = 0; i < rows.length; i += 500) {
        await db.insert(t.factContracts).values(rows.slice(i, i + 500)).onConflictDoNothing();
      }
    }
  },
};

// ---- helpers ----
function groupSum(items: AnacContract[], key: (c: AnacContract) => string): Map<string, number> {
  const m = new Map<string, number>();
  for (const c of items) {
    const k = key(c) || "—";
    m.set(k, (m.get(k) ?? 0) + c.importo);
  }
  return m;
}
function toBars(m: Map<string, number>, colors: string[]): Bar[] {
  const sorted = [...m.entries()].sort((a, b) => b[1] - a[1]);
  const max = sorted[0]?.[1] || 1;
  return sorted.map(([label, value], i) => ({
    label,
    value: euroMln(value),
    pct: Math.round((value / max) * 100),
    color: colors[i] ?? "var(--stone)",
  }));
}
function observedLabel(): string {
  return YEARS.length > 1 ? `${YEARS[0]}–${YEARS[YEARS.length - 1]}` : YEARS[0];
}
function titleCase(s: string): string {
  return s ? s.charAt(0) + s.slice(1).toLowerCase() : s;
}
