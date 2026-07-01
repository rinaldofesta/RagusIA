# ISTAT — demographic data (population, foreign residents, age structure) for Comune di Ragusa

Research date: 2026-07-01. All requests below were actually executed with `curl` against the live ISTAT SDMX REST API (`esploradati.istat.it`). Territory-area research used WebSearch/WebFetch only (no working API endpoint was found for that one field — see Verdict).

## Verdict: YELLOW (partial) — population, foreign %, and age structure are GREEN; territorial area (km²) is RED via API

**Population, % foreign residents, and 0-14/15-64/65+ age shares are fully feasible and were verified live** against the ISTAT SDMX REST API at `https://esploradati.istat.it/SDMXWS/rest`. No API key, no auth, no CORS preflight issue expected server-side (standard REST, but see Gotchas re: browser CORS). Data is official ISTAT resident-population data (source `dati.istat.it` / new "IstatData" dissemination system), licensed CC-BY.

Verified live for Ragusa (ISTAT comune code **088009**):
- **Resident population at 1 Jan 2025: 73,878** — exact match to the brief's target (~73.878).
- **Foreign residents at 1 Jan 2025: 7,124** → **9.64%** of 73,878 — matches the brief's target (~9.6%) almost exactly.
- **Age structure (computed from 5-year brackets, 31 Dec 2024 vintage, total = 73,878):**
  - 0-14: 9,238 → **12.50%**
  - 15-64: 46,793 → **63.34%**
  - 65+: 17,847 → **24.16%**
  (Sum of the three brackets reconciles exactly to 73,878, matching the same-year total from the primary population dataflow — good internal consistency check.)

**Territorial area (444.67 km²) is NOT available as an SDMX/REST-queryable field.** ISTAT does not expose comune surface area as a queryable indicator in any dataflow found (checked `22_289`/`DCIS_POPRES1`, `29_7`, `22_293`/`DCIS_INDDEMOG1`, and the census-derived `DF_DCSS_POP_DEMCITMIG_TV_*` family — none carry a surface-area or population-density value for Ragusa at comune level; `PD` (population density) and `RESFORPOP_AV` codes exist in the codelist but returned `NoRecordsFound` for 088009, meaning they're populated only for large cities/other territorial levels). Area is distributed by ISTAT only as:
- GIS shapefiles ("Confini delle unità amministrative a fini statistici", updated annually, WGS84) — requires geometry processing to derive km², not a simple field read.
- The SITUAS portal (`situas.istat.it`) "Report Comuni-Dimensione" — a GUI-driven Oracle APEX app; attempted to reach it directly (`curl` to `situas.istat.it`) and got connection timeouts / no stable public JSON endpoint discovered. Not viable as a programmatic source within research time.
- The static `Elenco-comuni-italiani.csv/.xlsx` file (permanent URL, verified live, see below) — contains only administrative codes (region/province/comune codes, cadastral code, NUTS codes), **no surface area column**.

**Recommendation:** treat area (444.67 km²) as a static config constant in the Phase-2 adapter (it changes only on rare administrative boundary revisions), sourced once from an authoritative reference (e.g. ISTAT's own published comune profile page or Wikipedia/Comune sourced from ISTAT), rather than fetched live. Do not block Phase 2 on this field.

## Endpoints

Base SDMX REST endpoint (confirmed live, HTTP 200): `https://esploradati.istat.it/SDMXWS/rest`

Three dataflows cover all three live-feasible target fields:

| Dataflow ID | DSD id | Content | Dimensions (key order) |
|---|---|---|---|
| `22_289` | `DCIS_POPRES1` | Resident population on 1st January | `FREQ.REF_AREA.DATA_TYPE.SEX.AGE.MARITAL_STATUS` |
| `29_7` | `DCIS_POPSTRRES1` | Resident foreigners on 1st January | `FREQ.REF_AREA.DATA_TYPE.SEX.AGE` |
| `DF_DCSS_POP_DEMCITMIG_TV_1` | `DCSS_POP_DEMCITMIG_TV` | Resident population by 5-year age group and gender — municipalities (census-derived, "Territori" dissemination) | `FREQ.REF_AREA.INDICATOR.GENDER.AGE_CLASS.MARITAL_STATUS.CITIZENSHIP.AREA_CONTRY_CITIZEN.USUAL_RESID_1Y` |

Structure/metadata discovery calls used (for future reference / re-verification):
```bash
curl -s -H "Accept: application/vnd.sdmx.structure+json;version=1.0" \
  "https://esploradati.istat.it/SDMXWS/rest/dataflow/IT1/22_289/latest/?references=all"

curl -s -H "Accept: application/vnd.sdmx.structure+json;version=1.0" \
  "https://esploradati.istat.it/SDMXWS/rest/dataflow/IT1/29_7/latest/?references=all"

curl -s -H "Accept: application/vnd.sdmx.structure+json;version=1.0" \
  "https://esploradati.istat.it/SDMXWS/rest/dataflow/IT1/DF_DCSS_POP_DEMCITMIG_TV_1/latest/?references=all"
```
These return large payloads (~2.6-2.8 MB) — the full DSD plus every attached codelist (FREQ, REF_AREA/ITTER107 with **12,471 codes**, SEX, AGE with 343 codes, MARITAL_STATUS, DATA_TYPE with ~300+ codes). Fine for a one-time discovery/caching step; not something to call per-request in the adapter.

Data query pattern: `GET /rest/data/{flowRef}/{key}?{params}` where `{key}` is a dot-separated list of dimension values in DSD order, empty segments = wildcard.

## Request params for Ragusa — verified working calls

Ragusa's REF_AREA / ITTER107 code in the ISTAT codelist is **`088009`** (6-digit, zero-padded — confirmed by direct codelist lookup: `"088009" -> "Ragusa"`, distinct from the NUTS3 code `ITG18` also present in the same codelist for the province).

**1. Resident population, 1 Jan, both sexes, all marital statuses (dataflow `22_289`):**
```bash
curl -s -H "Accept: application/vnd.sdmx.data+csv;version=1.0.0" \
  "https://esploradati.istat.it/SDMXWS/rest/data/22_289/A.088009.JAN.9.TOTAL.99?startPeriod=2023"
```
Key = `FREQ(A).REF_AREA(088009).DATA_TYPE(JAN).SEX(9=total).AGE(TOTAL).MARITAL_STATUS(99=total)`.

Note: `DATA_TYPE=POPSTAT` (also in the codelist, meaning "statistical population on 1st January") was tried first and returned `NoRecordsFound` — **`JAN` is the code that actually has comune-level data**, not `POPSTAT`. Also confirmed that at comune level this dataflow **only** carries `AGE=TOTAL` (no age breakdown) — verified by requesting all combinations with wildcards (`A.088009......`) and finding a single `DATA_TYPE,AGE` pair: `JAN,TOTAL`.

**2. Foreign residents, 1 Jan, both sexes, all ages (dataflow `29_7`):**
```bash
curl -s -H "Accept: application/vnd.sdmx.data+csv;version=1.0.0" \
  "https://esploradati.istat.it/SDMXWS/rest/data/29_7/A.088009.JAN.9.TOTAL?startPeriod=2023"
```
Key = `FREQ(A).REF_AREA(088009).DATA_TYPE(JAN).SEX(9=total).AGE(TOTAL)`. Note this dataflow's DSD has only 5 dimensions (no MARITAL_STATUS) — one fewer segment than `22_289`.

**3. Age structure by 5-year bracket, both sexes (dataflow `DF_DCSS_POP_DEMCITMIG_TV_1`):**
```bash
curl -s -H "Accept: application/vnd.sdmx.data+csv;version=1.0.0" \
  "https://esploradati.istat.it/SDMXWS/rest/data/DF_DCSS_POP_DEMCITMIG_TV_1/A.088009.RESPOP_AV........?lastNObservations=1"
```
Key = `FREQ(A).REF_AREA(088009).INDICATOR(RESPOP_AV).GENDER().AGE_CLASS().MARITAL_STATUS().CITIZENSHIP().AREA_CONTRY_CITIZEN().USUAL_RESID_1Y()` — 9 dimensions total, only first 3 pinned, rest wildcarded to get every gender × age-class combination in one call. Filter client-side to `GENDER=T` (total) rows.

General response-format control (works across all dataflows):
- CSV: `Accept: application/vnd.sdmx.data+csv;version=1.0.0`
- SDMX-JSON (compact): `Accept: application/json`
- Default (no Accept header): SDMX-ML/XML
- Time filter: `?startPeriod=YYYY` / `?endPeriod=YYYY` (community docs warn `endPeriod` has an off-by-one bug returning one extra year — not hit in our tests since we used `startPeriod` only or `lastNObservations`)
- `?lastNObservations=N` — get only the N most recent periods per series, useful to avoid full history dumps.

## Sample response (trimmed, real, live)

**Population 2019-2026, Ragusa, `22_289`:**
```csv
DATAFLOW,FREQ,REF_AREA,DATA_TYPE,SEX,AGE,MARITAL_STATUS,TIME_PERIOD,OBS_VALUE,OBS_STATUS,...
IT1:22_289(1.0),A,088009,JAN,9,TOTAL,99,2022,72779,,...
IT1:22_289(1.0),A,088009,JAN,9,TOTAL,99,2023,73476,,...
IT1:22_289(1.0),A,088009,JAN,9,TOTAL,99,2024,73736,,...
IT1:22_289(1.0),A,088009,JAN,9,TOTAL,99,2025,73878,,...
IT1:22_289(1.0),A,088009,JAN,9,TOTAL,99,2026,74122,e,...
```
(`OBS_STATUS=e` on the 2026 row flags it as an *estimate* — the most recent year in a "population on 1 Jan" series is provisional until finalized. 2025 has no flag, i.e. finalized.)

**Foreign residents 2023-2026, Ragusa, `29_7`:**
```csv
DATAFLOW,FREQ,REF_AREA,DATA_TYPE,SEX,AGE,TIME_PERIOD,OBS_VALUE,OBS_STATUS,...
IT1:29_7(1.0),A,088009,JAN,9,TOTAL,2023,6299,,...
IT1:29_7(1.0),A,088009,JAN,9,TOTAL,2024,6580,,...
IT1:29_7(1.0),A,088009,JAN,9,TOTAL,2025,7124,,...
IT1:29_7(1.0),A,088009,JAN,9,TOTAL,2026,7668,e,...
```

**Age brackets 2024, Ragusa, `DF_DCSS_POP_DEMCITMIG_TV_1` (GENDER=T rows only, trimmed):**
```csv
DATAFLOW,FREQ,REF_AREA,INDICATOR,GENDER,AGE_CLASS,...,TIME_PERIOD,OBS_VALUE,...
IT1:DF_DCSS_POP_DEMCITMIG_TV_1(1.0),A,088009,RESPOP_AV,T,TOTAL,...,2024,73878,...
IT1:DF_DCSS_POP_DEMCITMIG_TV_1(1.0),A,088009,RESPOP_AV,T,Y_UN4,...,2024,2800,...
IT1:DF_DCSS_POP_DEMCITMIG_TV_1(1.0),A,088009,RESPOP_AV,T,Y5-9,...,2024,3063,...
IT1:DF_DCSS_POP_DEMCITMIG_TV_1(1.0),A,088009,RESPOP_AV,T,Y10-14,...,2024,3375,...
IT1:DF_DCSS_POP_DEMCITMIG_TV_1(1.0),A,088009,RESPOP_AV,T,Y15-19,...,2024,3690,...
... (Y20-24 .. Y60-64, ten more 5-year brackets covering 15-64) ...
IT1:DF_DCSS_POP_DEMCITMIG_TV_1(1.0),A,088009,RESPOP_AV,T,Y65-69,...,2024,4656,...
IT1:DF_DCSS_POP_DEMCITMIG_TV_1(1.0),A,088009,RESPOP_AV,T,Y70-74,...,2024,4006,...
IT1:DF_DCSS_POP_DEMCITMIG_TV_1(1.0),A,088009,RESPOP_AV,T,Y75-79,...,2024,3758,...
IT1:DF_DCSS_POP_DEMCITMIG_TV_1(1.0),A,088009,RESPOP_AV,T,Y80-84,...,2024,2451,...
IT1:DF_DCSS_POP_DEMCITMIG_TV_1(1.0),A,088009,RESPOP_AV,T,Y85-89,...,2024,1932,...
IT1:DF_DCSS_POP_DEMCITMIG_TV_1(1.0),A,088009,RESPOP_AV,T,Y90-94,...,2024,807,...
IT1:DF_DCSS_POP_DEMCITMIG_TV_1(1.0),A,088009,RESPOP_AV,T,Y95-99,...,2024,215,...
IT1:DF_DCSS_POP_DEMCITMIG_TV_1(1.0),A,088009,RESPOP_AV,T,Y_GE100,...,2024,22,...
```

## Field mapping (response → our `demografia` fields)

| Our field | Source dataflow | Filter (dimension values) | Column | Computation |
|---|---|---|---|---|
| `popolazione_residente` (latest year) | `22_289` | `REF_AREA=088009`, `DATA_TYPE=JAN`, `SEX=9`, `AGE=TOTAL`, `MARITAL_STATUS=99` | `OBS_VALUE` at max `TIME_PERIOD` where `OBS_STATUS` is empty (prefer finalized over `e`=estimate row, i.e. take the most recent non-estimate year, or clearly label as "stima" if only the estimate year is desired) | direct value, e.g. 73,878 for TIME_PERIOD=2025 |
| `percentuale_stranieri` | `29_7` (numerator) + `22_289` (denominator) | `29_7`: `REF_AREA=088009, DATA_TYPE=JAN, SEX=9, AGE=TOTAL`; `22_289`: same key as above, same `TIME_PERIOD` | `OBS_VALUE` from each | `foreign_OBS_VALUE / population_OBS_VALUE * 100`, e.g. 7124/73878*100 = 9.64% |
| `superficie_kmq` | *(none — static config)* | n/a | n/a | Hardcode 444.67 km² as a constant; do not attempt a live API fetch (see Verdict/Gotchas) |
| `quota_0_14` | `DF_DCSS_POP_DEMCITMIG_TV_1` | `REF_AREA=088009, INDICATOR=RESPOP_AV, GENDER=T`, `AGE_CLASS` ∈ {`Y_UN4`, `Y5-9`, `Y10-14`} | `OBS_VALUE`, summed | `sum(brackets) / TOTAL_OBS_VALUE * 100` where `TOTAL_OBS_VALUE` = same query with `AGE_CLASS=TOTAL` |
| `quota_15_64` | `DF_DCSS_POP_DEMCITMIG_TV_1` | same, `AGE_CLASS` ∈ {`Y15-19`,`Y20-24`,`Y25-29`,`Y30-34`,`Y35-39`,`Y40-44`,`Y45-49`,`Y50-54`,`Y55-59`,`Y60-64`} | `OBS_VALUE`, summed | as above |
| `quota_65_plus` | `DF_DCSS_POP_DEMCITMIG_TV_1` | same, `AGE_CLASS` ∈ {`Y65-69`,`Y70-74`,`Y75-79`,`Y80-84`,`Y85-89`,`Y90-94`,`Y95-99`,`Y_GE100`} | `OBS_VALUE`, summed | as above |

Cross-check performed: summing all `AGE_CLASS` brackets for `GENDER=T` reproduces `TOTAL` exactly (73,878 = 73,878), confirming the bracket set is complete and non-overlapping — safe to sum client-side without needing to also fetch `AGE_CLASS=TOTAL` separately (though fetching it too is cheap and a good sanity check to keep in the adapter).

Simpler alternative for age structure if `DF_DCSS_POP_DEMCITMIG_TV_1` becomes unavailable: dataflow `22_289` (main population dataflow) has an "All municipalities by age" **variant view** `22_289_DF_DCIS_POPRES1_24`, but a direct query for it with the same key pattern as `22_289` returned `NoRecordsFound` in testing — it likely uses a different key structure/aggregation than assumed and needs its own DSD lookup before use. Not pursued further since `DF_DCSS_POP_DEMCITMIG_TV_1` already worked cleanly.

## License / auth / limits

- **Auth:** none. Fully public, unauthenticated REST GET requests.
- **License:** ISTAT open data is released under **Creative Commons Attribution** (CC-BY); older material may still say CC-BY 3.0 but ISTAT's current guidance/AGID best practice is CC-BY 4.0 for new datasets. Attribution to ISTAT as source is required; commercial reuse is permitted.
- **CORS:** not empirically confirmed in this session (see Gotchas — we got rate-limited before a clean header check could complete). Community guidance and prior integrations treat this API as server-to-server; **do not assume browser-side fetch will work without a proxy** — plan for the Phase-2 adapter to call ISTAT from the Next.js server/API route, not from client code.
- **Rate limit: 5 queries per minute per IP address**, documented by the community guide (ondata/guida-api-istat). **This was empirically confirmed live in this research session**: after roughly 15-20 rapid discovery/data requests, `esploradati.istat.it` became completely unreachable (connection timeouts) from our IP while `www.istat.it` remained reachable — strong evidence the SDMX web service throttles/blocks aggressively. The community guide states the block can last **1-2 days** once tripped. **This is the single biggest operational risk for the Phase-2 adapter.**

## Adapter notes (how the Phase-2 adapter should fetch + parse)

1. **Cache aggressively, fetch rarely.** ISTAT population data updates once a year (1 January release, typically published a few months later). There is no reason to call this API more than once per day (ideally once per deploy or via a scheduled job), and definitely not per user request. Persist the fetched values (population, foreign %, age shares) in the app's own data store / static JSON, refreshed by a cron/background job — never call ISTAT synchronously from a user-facing request path, both for latency and to avoid tripping the 5 req/min block.
2. **Batch the 3 dataflow calls needed per refresh** (population, foreign residents, age brackets) with a deliberate delay (e.g. 15-20s apart) to stay under 5 req/min, and add the structure/DSD discovery calls only when (re)building the codelist cache, not on every data refresh.
3. **Request CSV, not XML/default.** Set `Accept: application/vnd.sdmx.data+csv;version=1.0.0` — far simpler to parse than SDMX-ML, and smaller payloads than the JSON structure format (which also embeds full codelists you don't need for a data query).
4. **Parse pattern:** CSV columns are `DATAFLOW,FREQ,REF_AREA,DATA_TYPE(or INDICATOR),...,TIME_PERIOD,OBS_VALUE,OBS_STATUS,...`. Pick the row(s) matching the dimension filter, read `TIME_PERIOD` and `OBS_VALUE`; treat `OBS_STATUS=e` rows as provisional estimates (fine to display but consider labeling "dato provvisorio" in the UI, or preferring the prior finalized year if strict accuracy is required).
5. **Hardcode Ragusa's REF_AREA code (`088009`) and cadastral code (`H163`)** as constants in the adapter — no need to re-resolve them per request; they're stable administrative identifiers (also cross-verified against the static `Elenco-comuni-italiani.csv` from `istat.it`, which independently confirms `Codice Comune formato alfanumerico = 088009` and `Codice Catastale del comune = H163` for Ragusa).
6. **Territorial area (444.67 km²): hardcode as a config constant**, not fetched from any API — no ISTAT REST/SDMX endpoint exposes it at comune granularity; it's only in shapefiles or the GUI-only SITUAS portal. Revisit only if ISTAT boundaries change (administrative territorial variations are rare and announced).
7. **Error handling:** treat `HTTP 404` with body `NoRecordsFound` as "no data for this key combination" (not a transport error) — this happened multiple times during discovery when guessing wrong `DATA_TYPE`/`AGE` codes (e.g. `POPSTAT` vs `JAN`), and is the API's normal way of saying "the key you built doesn't match any series." Also treat connection timeouts to `esploradati.istat.it` as a likely rate-limit block and back off significantly (hours, not seconds) rather than retrying — a naive retry loop will prolong or worsen the block.
8. **Fallback for age structure:** if `DF_DCSS_POP_DEMCITMIG_TV_1` is retired/renamed (ISTAT does periodically rev these dataflow-variant IDs), re-discover via `GET /rest/dataflow/IT1/all/latest/?detail=allstubs` (returns ~4,876 dataflow stubs with id + name, ~1.7 MB) and grep dataflow names for `"age groups (five-year)" + "municipalities"` to find the current ID; the underlying DSD (`DCSS_POP_DEMCITMIG_TV`) and `INDICATOR=RESPOP_AV` code are more likely to remain stable than the specific dataflow "view" ID.
