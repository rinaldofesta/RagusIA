# RagusIA Phase 2 — Live Data Ingestion

**Goal:** Replace Phase-1 seed data with **live Italian open-data** for the Comune di Ragusa, source by source, behind the existing adapter seam — repository + UI unchanged.

**Approach:** Each source has a `LiveAdapter` (`lib/data/adapters/sources/<id>.ts`) that `fetch()`es live data + `apply()`s it (idempotent Drizzle upsert) into the object-model tables. The `pnpm ingest [source]` CLI (`lib/data/ingest/`) runs adapters and updates each source's **real provenance + health**: success → `ok` with fresh `retrieved`/`rows`/`observed`; failure → last-good data is preserved and the source flips to `warn` ("a rischio") — the design's ingestion-health model made real. The app keeps reading from Postgres.

## Feasibility matrix (verified against live endpoints, 2026-07-01)

Each source was researched by an agent that **called the real API** and captured live responses (`design/phase2-research/<source>.md`).

| Source | Verdict | Endpoint (verified) | Feeds | Notes |
|---|---|---|---|---|
| **DAIT** | 🟢 GREEN | `dait.interno.gov.it/documenti/provincia_di_ragusa.csv` (`;` CSV) | Organigramma | Roster live (sindaco/assessori/consiglieri/presidente); **no `delega` field** → portfolios stay curated (carried over by surname match). Filter `denominazione_comune=RAGUSA & sigla_provincia=RG`. |
| **IndicePA** | 🟢 GREEN | `indicepa.gov.it/ipa-dati/api/3/action/datastore_search` (CKAN) | Ente/uffici (provenance) | Provenance-only refresh (ente `c_h163`, PEC, org-unit count). CORS-open, no rate limit. |
| **OpenPNRR** | 🟢 GREEN | `openpnrr.it/api/v1/` (`/territori?istat_id=088009`→id, `/progetti?territori=id`) | PNRR domain | Per-missione counts. **Exclude multi-comune projects** from the € KPI (they inflate ~12×). Licence **ODbL 1.0** (share-alike). |
| **OpenCoesione** | 🟢 GREEN | `opencoesione.gov.it/it/api/aggregati/territori/ragusa-comune.json?ciclo_programmazione=2021_2027` | Opere/coesione | 116 interventi + status breakdown. **429 after 2-3 rapid calls** → adapter is gentle; always `.json`. CC-BY 4.0. |
| **BDAP** | 🟢 GREEN | `openbdap.rgs.mef.gov.it/Datasets_FET/previsione/{year}/{year}_Previsione - Schemi di bilancio_SICILIA.zip` | Bilancio | Plain CSV in a regional ZIP (no XBRL). Filter `Denominazione Soggetto="COMUNE DI RAGUSA"`. 19-mission + Titolo I/II split. ISO-8859-1. Total-reconciliation caveat (assestato vs iniziale). |
| **ISTAT** | 🟡 YELLOW | `esploradati.istat.it/SDMXWS/rest/data/22_289/A.088009.JAN.9.TOTAL.99` (SDMX) | Demografia | Population / % foreign / age structure live; **superficie km² not in API → curated 444,67**. **5 req/min throttle** → adapter spaces calls + degrades to `warn` if blocked. CC-BY. |
| **Eligendo** | 🔴 RED → curated | official portal has no Ragusa comunali-2023 data (WAF/opaque codes); Regione Siciliana HTML report has it but it's **static historical** data | Elezioni | Kept on curated seed (already the real, verified 2023 result). Provenance notes the regional report. |

## Ingestion framework (built)

- `lib/data/ingest/framework.ts` — `LiveAdapter` interface (`fetch()`→`{ok,rows,observed,data,note}`, `apply(data)`), `runIngest()` orchestrator (per-source try/catch; ok→provenance refresh, fail→`warn` + data preserved), `fetchText/fetchJson/parseCsv` (windows-1252 aware) + date helpers (real timestamps).
- `lib/data/ingest/index.ts` — adapter registry.
- `pnpm ingest [id ...]` — runs selected (or all) adapters.

## Adapters (this phase)

`lib/data/adapters/sources/{istat,dait,indicepa,openpnrr,opencoesione,bdap}.ts`, registered in
`lib/data/ingest/index.ts`. Each preserves curated fields where the live source lacks them (DAIT
deleghe, ISTAT superficie, BDAP capitoli/trend).

## Verification

1. `pnpm exec tsc --noEmit` — adapters + registry compile.
2. `pnpm ingest all` — one live pass; observe per-source `ok`/`warn` report.
3. Confirm live values landed (demografia residenti, bilancio missioni, pnrr per-missione, opere status) and provenance/health updated (Fonti registry, sidebar `n/12 fonti ok`).
4. Re-screenshot the affected surfaces vs the seed baseline.

## Notes

- Ingestion is idempotent and re-runnable (a refresh). A source that is down/rate-limited simply
  keeps its last-good data and shows `a rischio` — honest, and exactly what the UI already renders.
- Licences vary (CC-BY, ODbL, IODL) — recorded per source; ODbL (OpenPNRR) is share-alike, flagged.
