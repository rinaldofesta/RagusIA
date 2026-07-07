// IndicePA (AgID) — provenance-only live adapter.
//
// IndicePA attests the ente/uffici anagraphic (Comune di Ragusa, IPA code
// `c_h163`) via AgID's public CKAN datastore API. This adapter does NOT own
// or write any domain surface: it exists to verify the ente record is still
// live and to refresh the source's health + real row count (the number of
// organizational units currently registered for c_h163). See
// `design/phase2-research/indicepa.md` for the verified endpoints, sample
// payloads, and the "131 vs ~48 uffici" note explaining why the row count
// legitimately differs from the seed value.
//
// CKAN Action API v3, no auth, CORS-open: https://indicepa.gov.it/ipa-dati/api/3/action/

import { fetchJson, fmtDate, type LiveAdapter } from "@/lib/data/ingest/framework";

const BASE = "https://indicepa.gov.it/ipa-dati/api/3/action/datastore_search";
const IPA_CODE = "c_h163";

// Resource ids resolved via package_show, current-format datasets only
// (per indicepa.md — legacy `amministrazioni`/`ou`/`aoo` resources are kept
// only for backward compatibility and are intentionally not used here).
const RESOURCE_ENTI = "d09adf99-dc10-4349-8c53-27b1e5aa97b6";
const RESOURCE_UNITA_ORGANIZZATIVE = "b0aa1f6c-f135-4c8a-b416-396fed4e1a5d";

export interface CkanDatastoreResponse<R> {
  success: boolean;
  result: {
    total: number;
    records: R[];
  };
}

export interface EnteRecord {
  Codice_IPA: string;
  Denominazione_ente: string;
  Mail1: string | null;
  Tipo_Mail1: string | null;
}

export interface IndicePaData {
  denominazione: string;
  pec: string | null;
  ouCount: number;
}

/** Parse the two CKAN datastore responses into the ente provenance record.
 *  Pure — returns null when the ente record is missing (fetch() → warn). Only
 *  attests Mail1 as PEC when it is actually certified (`Tipo_Mail1 === "Pec"`). */
export function parseIndicePa(
  enteRes: CkanDatastoreResponse<EnteRecord>,
  uoRes: CkanDatastoreResponse<unknown>,
): IndicePaData | null {
  const ente = enteRes.result?.records?.[0];
  if (!enteRes.success || !ente) return null;
  return {
    denominazione: ente.Denominazione_ente,
    pec: ente.Tipo_Mail1 === "Pec" ? ente.Mail1 : null,
    ouCount: uoRes.result?.total ?? 0,
  };
}

function datastoreUrl(resourceId: string, opts: { limit?: number } = {}): string {
  const params = new URLSearchParams({
    resource_id: resourceId,
    filters: JSON.stringify({ Codice_IPA: IPA_CODE }),
  });
  if (opts.limit !== undefined) params.set("limit", String(opts.limit));
  return `${BASE}?${params.toString()}`;
}

export const indicepaAdapter: LiveAdapter<IndicePaData> = {
  id: "indicepa",
  label: "IndicePA — AgID",
  feeds: "anagrafica ente (provenienza)",

  async fetch() {
    try {
      const [enteRes, uoRes] = await Promise.all([
        fetchJson<CkanDatastoreResponse<EnteRecord>>(datastoreUrl(RESOURCE_ENTI)),
        // limit=0 → CKAN still returns the exact `total`, without the row payload.
        fetchJson<CkanDatastoreResponse<unknown>>(datastoreUrl(RESOURCE_UNITA_ORGANIZZATIVE, { limit: 0 })),
      ]);

      const data = parseIndicePa(enteRes, uoRes);
      if (!data) {
        return { ok: false, rows: 0, observed: "", note: "IndicePA non raggiungibile" };
      }

      return {
        ok: true,
        rows: data.ouCount,
        observed: fmtDate(new Date()),
        data,
      };
    } catch {
      return { ok: false, rows: 0, observed: "", note: "IndicePA non raggiungibile" };
    }
  },

  // Provenance-only: IndicePA attests the ente/uffici anagraphic but doesn't
  // own any model table here. No writes — just confirm what was verified.
  async apply(data) {
    console.log(`  · IndicePA verificato: ${data.denominazione} · ${data.pec ?? "(nessuna PEC)"} · ${data.ouCount} unità organizzative`);
  },
};
