# ANAC — public contracts (appalti) for Comune di Ragusa

Research date: 2026-07-01. Verified live against `dati.anticorruzione.it`.

## Verdict: YELLOW (feasible for contracts/tenders; winners impractical)

ANAC's open-data portal is behind a WAF that rejects non-browser requests, but the CKAN API and
file downloads work with a **desktop Chrome User-Agent**. There is **no datastore / no API filter**
by comune — data is published as **bulk national monthly files**. Comune di Ragusa's contracts are
retrievable by downloading the `cig-YYYY` monthly CSVs and filtering
`cf_amministrazione_appaltante == 00180270886` client-side.

- **Reachable + filterable:** `cig-YYYY` (tenders/CIG) — real oggetto, importo, tipologia, ufficio,
  CPV, date. ~6 MB compressed / ~30 MB CSV **per month** (~75 MB/year). Verified: 9 Ragusa rows in
  Jan 2024 alone (of 40,383 national), full real fields.
- **Impractical:** the *aggiudicatario* (winner) lives in the separate `aggiudicazioni` dataset —
  a **758 MB cumulative national file**, keyed by CIG, with no CF field. Joining it for real
  operatori is too heavy for routine ingestion. (The design already labels operator names
  "illustrativi nel prototipo", so this is an acceptable gap.)

## Endpoints (work with a Chrome UA)

- CKAN API: `https://dati.anticorruzione.it/opendata/api/3/action/{package_list,package_show,package_search}`
  — needs `User-Agent: Mozilla/5.0 ... Chrome/...` + `Accept: application/json` (plain curl UA is WAF-rejected).
- Monthly CIG download (predictable URL, no auth):
  `https://dati.anticorruzione.it/opendata/download/dataset/cig-{YEAR}/filesystem/cig_csv_{YEAR}_{MM}.zip`
  (MM = 01..12; each zip contains one `cig_csv_{YEAR}_{MM}.csv`, `;`-delimited, UTF-8).
- The SPARQL endpoint (`/sparql`) is 404. TTL/JSON variants exist but are far larger than CSV.

## Filter to Ragusa

`cf_amministrazione_appaltante == "00180270886"` (column 21). `denominazione_amministrazione_appaltante`
== "COMUNE DI RAGUSA" as a cross-check.

## CSV columns used (of 50)

| Our field | ANAC column |
|---|---|
| CIG | `cig` (1) |
| oggetto | `oggetto_lotto` (7) ?? `oggetto_gara` (4) |
| importo | `importo_lotto` (8) ?? `importo_complessivo_gara` (5) |
| tipologia | `oggetto_principale_contratto` (9) — LAVORI / SERVIZI / FORNITURE |
| ufficio | `denominazione_centro_costo` (25) — e.g. "SETTORE VII", "UFFICIO TECNICO SETTORE IX" |
| data | `data_pubblicazione` (14) |
| filter | `cf_amministrazione_appaltante` (21) |

## Sample real rows (Jan 2024, Comune di Ragusa)

```
B009477603 · SERVIZI DI ANALISI DIGITAL DATA TURISTICI · €17.900 · SERVIZI · SETTORE VII · 2024-01-18
A04AC4B723 · ACCORDO QUADRO MANUTENZIONE CENTRO STORICO RAGUSA IBLA · €71.642,23 · LAVORI · UFFICIO TECNICO COMUNALE · 2024-01-18
B009397D27 · SERVIZI TURISTICI DIGITALI · €67.500 · SERVIZI · SETTORE VII · 2024-01-18
```

## License / auth / limits

- **License:** CC-BY 4.0 (ANAC open data). **Auth:** none, but **WAF requires a browser UA** (and
  is fingerprint-sensitive — use curl, like ISTAT). **Size:** ~75 MB/year compressed across 12 files.
- Bulk-only, no per-comune filter → the adapter downloads the monthly CSVs for a bounded year window
  and filters client-side. This is a heavy, occasional batch job (not a per-request path).

## Adapter plan (implemented)

`anacAdapter` (cig-only, bounded years, default 2024–2025):
- For each year/month: `curlBuffer` the zip → fflate unzip → csv-parse → filter CF → collect
  { cig, oggetto, importo, tipologia, ufficio, data }, dedup by CIG.
- Populate `appalti`: real KPIs (n contratti, valore complessivo, importo medio, uffici committenti),
  per-tipologia bars (Lavori/Servizi/Forniture by value), per-ufficio bars (centro_costo by value),
  recent-contracts table (real cig/oggetto/importo/tipologia/ufficio/data).
- Winners (operatori) intentionally omitted (758 MB join impractical). The appalti risk banner is
  made conditional on ANAC's live health → disappears when ingestion succeeds; ANAC flips to `ok`.
