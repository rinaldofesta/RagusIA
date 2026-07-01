# OpenCoesione — cohesion-policy interventions (FESR/FSE/FSC) for Comune di Ragusa

Research date: 2026-07-01. All requests below were actually executed with `curl` against the live API.

## Verdict: GREEN

Public, unauthenticated, CORS-open JSON REST-like API at `opencoesione.gov.it/it/api/`. No API key required for basic use (registration only raises the rate limit). Directly filterable by comune via a `territorio` slug resolved from ISTAT code, and by programming cycle / fund source via facet-backed query params. Verified live: **exactly 116 progetti** localized in Comune di Ragusa (ISTAT 088009, slug `ragusa-comune`) for the **2021-2027 programming cycle** — this matches the brief's ~116 figure precisely, confirming that "116" refers specifically to the *current* cohesion cycle (2021-2027), not the all-time total (which is 1,939 across all cycles back to 2000-2006). Total public cost for these 116 projects: **€89,102,287**, of which €75,088,536 is cohesion-funded. Status breakdown available out of the box via the `aggregati` endpoint.

Two things to flag for the domain-data write-up:
1. **"116" ≠ all cohesion projects ever in Ragusa.** It is the 2021-2027 cycle subset (fonte facet: FS2127 = 102 FESR/FSE projects + FSC2127 = 14 FSC projects = 116 total). If "PNRR & Coesione" is meant to represent *current* cohesion policy (which pairs naturally with PNRR, itself a 2021-2026 instrument), this is the right slice. If instead the intent was "all cohesion interventions ever localized in Ragusa," the number is 1,939 (€1.66B total public cost) — a very different order of magnitude. Recommend explicitly using the 2021-2027 cycle filter and labeling it as such in the UI (e.g. "116 interventi di coesione 2021-2027").
2. The `territorio=ragusa-comune` filter returns projects **localized in Ragusa**, including multi-comune projects (e.g. a €480M ANAS road project spanning 7 comuni including Ragusa) when not cycle-filtered. Within the 116 (2021-2027) subset, a quick spot-check of results shows `territori: ["ragusa-comune"]` (single-comune) for the sampled rows — worth a full-page pull to confirm none of the 116 are multi-comune before summing "total financing" naively, since a multi-comune project's full `oc_finanz_tot_pub_netto` is not apportioned per comune.

## Endpoints

Base: `https://opencoesione.gov.it/it/api/` (path-based on the main domain, not a separate `api.opencoesione.gov.it` subdomain).

Root discovery:
```bash
curl -s "https://opencoesione.gov.it/it/api/"
```
```json
{"progetti":"https://opencoesione.gov.it/it/api/progetti/","soggetti":"https://opencoesione.gov.it/it/api/soggetti/","aggregati":"https://opencoesione.gov.it/it/api/aggregati/","temi":"https://opencoesione.gov.it/it/api/temi/","nature":"https://opencoesione.gov.it/it/api/nature/","territori":"https://opencoesione.gov.it/it/api/territori/","programmi":"https://opencoesione.gov.it/it/api/programmi/","data_aggiornamento":"20260228"}
```

Relevant endpoints for our use case (append `.json` to force JSON instead of the HTML browsable UI, which is slow/timeout-prone — see Gotchas):
- `GET /it/api/territori.json?denominazione=<NOME>` — resolve a comune/provincia name to its `slug`, `cod_reg`, `cod_prov`, `cod_com` (ISTAT code). Confirmed `Ragusa` → `slug: "ragusa-comune"`, `cod_com: 88009` (matches ISTAT 088009).
- `GET /it/api/progetti.json?territorio=<slug>&ciclo_programmazione=<cycle>` — list + count projects localized in a territory, optionally filtered by cycle. Response includes `count`, pagination, and a `facet_counts` object breaking the *current filtered set* down by `ciclo_programmazione`, `natura`, `tema`, `fonte`, `stato`, `focus` — this is how the 116 figure and its `fonte`/`stato` splits were found.
- `GET /it/api/aggregati/territori/<slug>.json?ciclo_programmazione=<cycle>` — pre-aggregated totals (costo_pubblico, costo_pubblico_coesione, pagamenti, numero progetti) for a territory, broken down by `stati_progetti` (non_avviato / in_corso / liquidato / concluso), `temi`, `nature`, and `impegni_e_pagamenti_per_anno`. **This is the best single call for our target fields** — no need to paginate through all 116 projects and sum client-side.
- `GET /it/api/progetti/<id>.json` — full project detail (CUP, all fund-source breakdown fields `finanz_ue_fesr`, `finanz_ue_fse`, `finanz_stato_fsc`, dates, subjects, territories list).
- Full CSV/Parquet open data dumps at `https://opencoesione.gov.it/it/opendata/` (see Adapter notes / fallback).

Undocumented-but-discovered filter values (found via the `facet_counts` block, not from static docs — the API does **not** publish a param reference that resolves live; see Gotchas):
- `ciclo_programmazione`: `2000_2006`, `2007_2013`, `2014_2020`, `2021_2027`
- `fonte`: `FS0713`, `FS1420`, `FS2127` (FESR/FSE by cycle), `FSC0006`, `FSC0713`, `FSC1420`, `FSC2127` (FSC by cycle), `PAC0713`, `POC1420`
- `stato`: `non_avviato`, `in_corso`, `liquidato`, `concluso`
- `natura`: `acquisto-beni-e-servizi`, `infrastrutture`, `contributi-a-persone`, `incentivi-alle-imprese`, `conferimenti-capitale`
- `tema`: `ricerca-e-innovazione`, `reti-servizi-digitali`, `competitivita-imprese`, `energia`, `ambiente`, `cultura-e-turismo`, `trasporti`, `occupazione`, `inclusione-sociale`, `istruzione`, `capacita-amministrativa`

## Request params for Ragusa — verified working calls

**Step 1 — resolve Ragusa's territorio slug from name (ISTAT 088009 confirmed in response):**
```bash
curl -s -A "Mozilla/5.0" "https://opencoesione.gov.it/it/api/territori.json?denominazione=RAGUSA"
```
Result (real, live, trimmed to the comune record):
```json
{
  "denominazione": "Ragusa",
  "tipo": "C",
  "slug": "ragusa-comune",
  "cod_reg": 19,
  "cod_prov": 88,
  "cod_com": 88009,
  "filtri": {
    "progetti": "https://opencoesione.gov.it/it/api/progetti.json?territorio=ragusa-comune",
    "soggetti": "https://opencoesione.gov.it/it/api/soggetti.json?territorio=ragusa-comune"
  }
}
```

**Step 2 — count + facets for the 2021-2027 cycle (the ~116 target):**
```bash
curl -s -A "Mozilla/5.0" "https://opencoesione.gov.it/it/api/progetti.json?territorio=ragusa-comune&ciclo_programmazione=2021_2027&page_size=2"
```
Result (real, live, trimmed):
```json
{
  "count": 116,
  "page_size": 2,
  "last_page": 58,
  "facet_counts": {
    "ciclo_programmazione": ["2021_2027 (116)"],
    "fonte": ["FS2127 (102)", "FSC2127 (14)"],
    "stato": ["non_avviato (53)", "in_corso (58)", "liquidato (4)", "concluso (1)"],
    "natura": ["acquisto-beni-e-servizi (44)", "infrastrutture (14)", "contributi-a-persone (39)", "incentivi-alle-imprese (19)"]
  },
  "results": [
    {
      "url": "https://opencoesione.gov.it/it/api/progetti/j22f24000140002-fscri_ri_3581-289860484/",
      "cod_locale_progetto": "J22F24000140002---FSCRI_RI_3581----289860484",
      "cup": "J22F24000140002",
      "cup_descr_natura": "REALIZZAZIONE DI LAVORI PUBBLICI (OPERE ED IMPIANTISTICA)",
      "oc_descr_ciclo": "Ciclo di programmazione 2021-2027",
      "oc_finanz_tot_pub_netto": "19527240,96",
      "oc_stato_progetto": "Non avviato",
      "oc_tema_sintetico": "Ambiente",
      "oc_titolo_progetto": "REVAMPING DELL'IMPIANTO DI TRATTAMENTO MECCANICO BIOLOGICO...",
      "tot_pagamenti": "0,00",
      "percentuale_avanzamento": "0%",
      "territori": ["ragusa-comune"]
    }
  ]
}
```

**Step 3 — pre-aggregated totals + status breakdown for the 2021-2027 cycle (recommended call — no pagination needed):**
```bash
curl -s -A "Mozilla/5.0" "https://opencoesione.gov.it/it/api/aggregati/territori/ragusa-comune.json?ciclo_programmazione=2021_2027"
```
Result (real, live, trimmed to the fields we need):
```json
{
  "contesto": {"nome_territorio": "Ragusa", "tipo_territorio": "C", "popolazione": 73476},
  "data_aggiornamento": "20260228",
  "aggregati": {
    "totali": {
      "costo_pubblico": "89102287,00",
      "costo_pubblico_coesione": "75088536,00",
      "pagamenti": "10926592,00",
      "pagamenti_coesione": "10828632,00",
      "progetti": "116"
    },
    "stati_progetti": {
      "non_avviato": {"label": "Non avviato", "totali": {"progetti": "53", "costo_pubblico": "38707624,00"}},
      "in_corso":    {"label": "In corso",    "totali": {"progetti": "58", "costo_pubblico": "49363216,00", "pagamenti": "9902624,00"}},
      "liquidato":   {"label": "Liquidato",   "totali": {"progetti": "4",  "costo_pubblico": "374754,00",   "pagamenti": "367274,00"}},
      "concluso":    {"label": "Concluso",    "totali": {"progetti": "1",  "costo_pubblico": "656693,00",   "pagamenti": "656693,00"}}
    }
  }
}
```
Note: 53+58+4+1 = 116, confirming the status breakdown sums exactly to the total — this single endpoint gives us the count, the total financing, and the full status breakdown in one call.

## Field mapping

| Our field | OpenCoesione source | Notes |
|---|---|---|
| `interventions_count` | `aggregati.totali.progetti` (116) | Filtered by `territorio=ragusa-comune&ciclo_programmazione=2021_2027` |
| `total_financing` | `aggregati.totali.costo_pubblico` (89,102,287 EUR) | "Costo pubblico" = total public cost; `costo_pubblico_coesione` (75,088,536) is the cohesion-fund-only subset if a narrower figure is wanted |
| `total_payments` | `aggregati.totali.pagamenti` (10,926,592 EUR) | Actual disbursed to date — useful for a "advancement" stat |
| `status.concluso` | `aggregati.aggregati.stati_progetti.concluso.totali.progetti` (1) | |
| `status.in_corso` | `...stati_progetti.in_corso.totali.progetti` (58) | |
| `status.programmato` / `non_avviato` | `...stati_progetti.non_avviato.totali.progetti` (53) | OpenCoesione's status label is "Non avviato" (not started), closest to our "programmato" |
| `status.liquidato` | `...stati_progetti.liquidato.totali.progetti` (4) | Extra 4th bucket beyond concluso/in_corso/programmato — "liquidato" (payments closed, administratively finalized) sits between in_corso and concluso; may fold into "concluso" for a 3-bucket UI |
| Fund type (FESR/FSE vs FSC) | `progetti.json` `facet_counts.fonte`: `FS2127` (102, FESR/FSE) + `FSC2127` (14, FSC) | Only available via the `progetti` list facets, not the `aggregati` endpoint; requires the list call if we want the FESR/FSE vs FSC split shown in the brief |
| Per-project title/theme/CUP | `progetti.json results[].oc_titolo_progetto`, `oc_tema_sintetico`, `cup` | For drill-down/detail views |
| Per-project link | `progetti.json results[].url` → `/it/api/progetti/<slug>.json` | Detail endpoint has full financing breakdown by source (FESR/FSE/FSC/regionale/comunale/etc.) |

## License / auth / limits

- **License: CC-BY 4.0** (verified on `https://opencoesione.gov.it/it/licenza/`, live fetch). The brief assumed IODL 2.0 — that's incorrect for this specific source; IODL is only mentioned on that page as general background on Italian open-data licensing, not as OpenCoesione's actual license. CC-BY 4.0 requires attribution but permits reuse/redistribution freely, including commercial.
- **Auth**: none required for the JSON API. Registered accounts (request via `info@opencoesione.gov.it`) get a higher rate limit; anonymous access is capped per the FAQ at "12 richieste al minuto" (12 req/min), registered at up to 60 req/min ("una al secondo").
- **Rate limit — verified live and stricter than documented**: firing 15 rapid sequential requests to `territori.json` produced `200 200 429 429 429 200 429 429 429 429 429 429 429 429 429` — i.e. we got throttled to HTTP 429 after just 2-3 requests in quick succession, well under the documented 12/min. **Adapter must add request spacing/backoff** (e.g. ≥2-3s between calls, or a simple retry-on-429 with backoff) even for a single comune's worth of calls (2-3 requests total is fine if spaced).
- **CORS**: wide open — `access-control-allow-origin: *` confirmed on live response headers. Safe to call directly from a browser/client-side fetch if desired (no proxy needed for CORS reasons, though the rate-limit/429 behavior argues for server-side caching anyway).
- **Update cadence**: `data_aggiornamento: "20260228"` in every response — data refreshed bimonthly (per opendata page), ~3 months delayed from real-world project status.

## Adapter notes

Exact working curl sequence (three calls, ~1-2s apart to stay under the rate limit):

```bash
# 1. Resolve comune slug from ISTAT/name (cache this — it's stable, no need to repeat per request)
curl -s -A "Mozilla/5.0" "https://opencoesione.gov.it/it/api/territori.json?denominazione=RAGUSA"
# -> slug "ragusa-comune", cod_com 88009 confirms ISTAT 088009

# 2. Get count + fund-source split for the current (2021-2027) cycle
curl -s -A "Mozilla/5.0" "https://opencoesione.gov.it/it/api/progetti.json?territorio=ragusa-comune&ciclo_programmazione=2021_2027&page_size=1"

# 3. Get pre-aggregated totals + status breakdown in one shot (main call to use)
curl -s -A "Mozilla/5.0" "https://opencoesione.gov.it/it/api/aggregati/territori/ragusa-comune.json?ciclo_programmazione=2021_2027"
```

Gotchas discovered while probing:
- **Send a `User-Agent` header.** Requests without one occasionally behaved inconsistently during testing; `-A "Mozilla/5.0"` was used throughout and worked reliably.
- **Unrecognized query params fail silently** on `aggregati` (ignored, full unfiltered result returned) but on `progetti.json` an *unrecognized value* for a *recognized* param (e.g. `ciclo_programmazione=3`) returns `count: 0` with empty facets rather than an error — easy to misread as "no data" instead of "wrong param value." Always sanity-check against the facet_counts of an unfiltered query first to discover valid values.
- **The HTML browsable API (`/it/api/progetti/` without `.json`) times out** (tested with 30s timeout, zero bytes received over an established TLS/HTTP2 connection) — always use the `.json` suffix, never rely on the browsable HTML docs for automation.
- **The human-facing search UI (`/it/dati/territori/ragusa-comune/`, `/it/progetti/?...`) has bot detection**: a plain curl request gets a 200 with a small anti-crawler interstitial page ("Stai cercando dati?") that explicitly redirects automated clients to `/it/opendata/` (CSV bulk downloads) instead of serving the filtered page. This does **not** affect the `/it/api/` JSON endpoints, which responded normally and fully throughout testing — use the API, not the human search pages, for programmatic access.
- **`territorio=ragusa-comune` without a cycle filter returns 1,939 projects / €1.66B**, including projects merely *touching* Ragusa as one of several comuni (e.g. a 7-comune ANAS road project). The 116/€89M figure only appears once `ciclo_programmazione=2021_2027` is applied. Get this filter right or the numbers will be off by more than 10x.

## Fallback if programmatic per-comune access were unavailable

Not needed here — the JSON API works cleanly and is the recommended path. But for completeness: OpenCoesione also publishes full bulk CSV/Parquet dumps ("Progetti con tracciato esteso", ~250MB compressed, updated bimonthly) at `https://opencoesione.gov.it/it/opendata/`, which include a `territori` linkage and could be filtered client-side by comune/ISTAT code as an offline alternative if the live API were ever deprecated or too rate-limited for our use case. Not verified by direct download in this research pass (file too large to fetch and inspect within scope), but its existence and CC-BY 4.0 license were confirmed via WebFetch of the opendata page.
