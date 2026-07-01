# BDAP — Bilancio di previsione / spesa per missione for Comune di Ragusa

Research date: 2026-07-01. All requests below were actually executed with `curl` against live BDAP/OpenBDAP infrastructure, including a full 6.0 MB regional ZIP download and CSV extraction/filtering for Comune di Ragusa.

## Verdict: GREEN (better than expected — this was assumed to be the hardest source, but it isn't)

The brief flagged BDAP as "likely the HARDEST source (XBRL/complex)". That assumption turns out to be **wrong for this specific use case**. While BDAP's core transmission format for local-entity harmonized budgets genuinely is XBRL (filed by entities via an authenticated Corte dei Conti "SMART" system), **OpenBDAP separately republishes the same data as clean, unauthenticated, per-comune, per-mission CSV files bundled into regional ZIP archives**, served from a stable, discoverable URL pattern with no login, no API key, and no XBRL parsing required. I found this by reverse-engineering the "Finanza degli Enti Territoriali → Analizza" web tool's JS (`fet_analizza.js`), which calls a plain REST-ish backend (`openbdap.rgs.mef.gov.it/fet/GetDocuments...`) to list downloadable ZIPs — then downloaded and verified one live.

**Verified live**: downloaded `2024_Previsione - Schemi di bilancio_SICILIA.zip` (6.0 MB, 64 files, no auth), extracted `2024_Bilancio di Previsione SDB Spese Riepilogo Missioni_SICILIA.csv` (6,185 rows, ISO-8859-1, `;`-delimited), filtered to `Denominazione Soggetto == "COMUNE DI RAGUSA"` and got a clean **19-row mission breakdown** with real amounts (see Sample response below). Also extracted the `Quadro Generale Riassuntivo Spese` file for the corrente/capitale (Titolo I/II) split.

Caveat on the target number: the brief's "~€117.6M" total previsione 2024 does not match any of the aggregate totals I computed from the raw BDAP transmission (see Field mapping / totals table below — closest is €158.3M for Titolo I+II, or €150-161M depending on which technical missions are excluded). This is a normal and expected discrepancy: BDAP's CSV reflects the **originally-transmitted** bilancio di previsione (Δ "CC 1° Anno" = competenza year 1), whereas a citizen dashboard figure is often a later **bilancio assestato** (post-variazioni) or a curated subtotal from the comune's own delibera. Recommend treating €117.6M as the number to reconcile against, not assume equals the BDAP figure — pull BDAP's number as the *source-of-truth from BDAP* and label it as "previsione iniziale trasmessa a BDAP" if it's shown next to a different total elsewhere in the app.

## Endpoints / download URLs (all verified live)

Two related domains, easy to confuse — both are real and both resolved:
- `bdap-opendata.mef.gov.it` → **does NOT resolve** (`curl: (6) Could not resolve host`). Old/retired hostname.
- `bdap-opendata.rgs.mef.gov.it` → **live**, CKAN-based open data catalog (1,230+ datasets), but dominated by State budget / SIOPE / enti-vigilati datasets, not per-comune harmonized bilancio data. CKAN REST API works (`/SpodCkanApi/api/3/action/package_search`, `package_list`) but full-text search for "bilancio", "missione", "comuni", "previsione", "armonizzati" returns 0-5 results, none of which are comune-level bilancio-di-previsione datasets. **Not the right catalog for this data.**
- `openbdap.rgs.mef.gov.it` → **live**, the actual portal with the "Finanza degli Enti Territoriali" (FET) section. This is where the real per-comune data lives, via bulk regional file download, not the CKAN catalog.

The actual working download mechanism, discovered via the FET "Analizza" page's JS (`/Content/js/fet/fet_analizza.js`, `webAPIAddress = "https://openbdap.rgs.mef.gov.it/api/"`):

**1. List available years for a document type:**
```bash
curl -s "https://openbdap.rgs.mef.gov.it/fet/GetDocumentsYears?type=previsione"
# -> [2026,2025,2024,2023,2022,2021,2020,2019,2018,2017,2016]
curl -s "https://openbdap.rgs.mef.gov.it/fet/GetDocumentsYears?type=rendiconto"
# -> [2025,2024,2023,2022,2021,2020,2019,2018,2017,2016]
```
Valid `type` values found: `previsione`, `rendiconto` (consuntivo), `consolidato`. (`type=consuntivo` — the intuitive guess — returns HTTP 500; must use `rendiconto`.)

**2. List downloadable ZIPs for a type/year/region:**
```bash
curl -s "https://openbdap.rgs.mef.gov.it/fet/GetDocuments?type=previsione&year=2024&country=Sicilia"
```
Live response:
```json
[
  {"Name":"Schemi di bilancio","Url":"/Datasets_FET/previsione/2024/2024_Previsione - Schemi di bilancio_SICILIA.zip"},
  {"Name":"Piano degli indicatori","Url":"/Datasets_FET/previsione/2024/2024_Previsione - Piano degli indicatori_SICILIA.zip"}
]
```
Note the param is called `country` in the JS but actually takes an Italian **region** name ("Sicilia"), not a country or a single comune — the granularity is regional bundles, not per-comune files. Comune-level filtering happens client-side after download (see below).

**3. Direct download (stable URL pattern, no auth, confirmed 200/6.0MB):**
```bash
curl -L -o sicilia_previsione_2024.zip \
  "https://openbdap.rgs.mef.gov.it/Datasets_FET/previsione/2024/2024_Previsione%20-%20Schemi%20di%20bilancio_SICILIA.zip"
```
URL pattern is fully predictable: `https://openbdap.rgs.mef.gov.it/Datasets_FET/{previsione|rendiconto}/{year}/{year}_{Previsione|Rendiconto} - Schemi di bilancio_{REGIONE_UPPERCASE}.zip` (URL-encode spaces). This means the adapter never even needs to call `GetDocuments` at runtime — the URL can be constructed directly once the pattern is known, though calling `GetDocuments` first is safer against future path changes.

Two other live-but-less-relevant endpoints found in the same JS file:
- `GET https://openbdap.rgs.mef.gov.it/api/fet/data_FET_a2_Cities?text=<query>` — city-name autocomplete for the search box. Returned HTTP 404 when tested directly (likely requires a different verb/header than plain GET, or the route changed) — not needed since we don't need autocomplete, just direct download.
- `GET https://openbdap.rgs.mef.gov.it/api/utility/sapd` — internal "last updated" timestamp utility, not data-bearing.

## Filter to Ragusa

The downloaded ZIP is a **regional bundle for all of Sicilia** (all comuni + the region + provinces + special-purpose regional bodies) — there is no comune-specific download URL. Filtering to Comune di Ragusa is a two-step client-side CSV filter:

1. **Extract** `2024_Bilancio di Previsione SDB Spese Riepilogo Missioni_SICILIA.csv` from the ZIP (this is the mission-level spending summary; the ZIP also contains a much larger, capitolo-level `..._Spese_SICILIA.csv`, 7.4MB, which we don't need for a mission-level view).
2. **Filter rows** where `Denominazione Soggetto == "COMUNE DI RAGUSA"` (column 5). This is critical: filtering only by `Codice Comune == "009"` (the province-relative code) is **not sufficient** — it also matches other entities headquartered in the comune of Ragusa that share the same territorial code: `ISTITUTO AUTONOMO PER LE CASE POPOLARI DELLA PROVINCIA DI RAGUSA`, `LIBERO CONSORZIO COMUNALE DI RAGUSA` (the province), and `ASSEMBLEA TERRITORIALE IDRICA DI RAGUSA` all appear under `Codice Comune = "009", Codice Provincia = "088"` in the same file. Must match on `Denominazione Soggetto` (or `Codice BDAP` = `664042930448245002`, the entity's stable BDAP identifier, confirmed live) to isolate the actual Comune.

ISTAT code reconstruction confirmed: `Codice Provincia` (`"088"`) + `Codice Comune` (`"009"`) = **088009**, matching the ISTAT code given in the brief. The file does not directly expose the 6-digit ISTAT code as a single field — it must be concatenated from these two columns. Cadastral code H163 does not appear anywhere in this dataset (not expected — BDAP uses ISTAT/BDAP codes, not cadastral codes).

## Sample response (real, live, trimmed)

CSV header (semicolon-delimited, ISO-8859-1 encoded, needs `iconv -f ISO-8859-1 -t UTF-8`) for `..._Spese Riepilogo Missioni_SICILIA.csv`:
```
"Esercizio Finanziario";"Codice Tipologia Soggetto";"Descrizione Tipologia Soggetto";"Codice BDAP";
"Denominazione Soggetto";"CF Soggetto";"Data Cessazione Soggetto";"Codice Zona Geografica";
"Descrizione Zona Geografica";"Codice Regione";"Descrizione Regione";"Codice Provincia";
"Descrizione Provincia";"Codice Comune";"Descrizione Comune";"Codice Missione Arconet";
"Descrizione Missione Arconet";"Previsioni in CR Esercizio Precedente";
"Previsioni in CC definitive Esercizio Precedente";"Previsioni in CC 1 Anno";
"Previsioni in CC 2 Anno";"Previsioni in CC 3 Anno"; ... (31 columns total, plus impegnato/FPV/cassa detail)
```

Filtered result for `COMUNE DI RAGUSA` — mission code | description | "Previsioni in CC 1 Anno" (competenza, 2024, i.e. the previsione initiale for the target year):

| Missione | Descrizione | Importo 2024 (€) |
|---|---|---|
| 01 | Servizi istituzionali, generali e di gestione | 25,319,300.07 |
| 03 | Ordine pubblico e sicurezza | 3,672,183.46 |
| 04 | Istruzione e diritto allo studio | 14,339,077.93 |
| 05 | Tutela e valorizzazione dei beni e delle attività culturali | 5,901,953.04 |
| 06 | Politiche giovanili, sport e tempo libero | 5,124,551.64 |
| 07 | Turismo | 1,013,320.33 |
| 08 | Assetto del territorio ed edilizia abitativa | 6,338,398.52 |
| 09 | Sviluppo sostenibile e tutela del territorio e dell'ambiente | 47,036,392.95 |
| 10 | Trasporti e diritto alla mobilità | 10,474,638.79 |
| 11 | Soccorso civile | 481,627.71 |
| 12 | Diritti sociali, politiche sociali e famiglia | 18,388,505.95 |
| 13 | Tutela della salute | 451,463.45 |
| 14 | Sviluppo economico e competitività | 3,108,186.19 |
| 16 | Agricoltura, politiche agroalimentari e pesca | 156,275.48 |
| 17 | Energia e diversificazione delle fonti energetiche | 8,500,000.00 |
| 20 | Fondi e accantonamenti (technical) | 7,734,670.86 |
| 50 | Debito pubblico (technical) | 3,064,576.24 |
| 60 | Anticipazioni finanziarie (technical) | 9,004,000.00 |
| 99 | Servizi per conto terzi (technical/pass-through) | 25,600,000.00 |

Totals computed (all real, from the live-filtered rows):
- Sum of all 19 missions: **€195,709,122.61**
- Excluding M99 + M60 (typical "operational" total): **€161,109,122.61**
- Excluding M99 + M60 + M50 + M20 (excluding all technical/pass-through missions): **€150,305,875.51**

From `Quadro Generale Riassuntivo Spese` (Titolo-level, same ZIP), Comune di Ragusa:

| Titolo | Descrizione | Importo 2024 (€) |
|---|---|---|
| 01 | Spese correnti | 89,557,064.13 |
| 02 | Spese in conto capitale | 68,734,993.51 |
| 03 | Spese per incremento attività finanziarie | 1,000,000.00 |
| 04 | Rimborso prestiti | 1,817,064.97 |
| 05 | Chiusura anticipazioni da tesoriere | 9,000,000.00 |
| 07 | Uscite per conto terzi e partite di giro | 25,600,000.00 |

Corrente + capitale (Titolo I+II) = **€158,292,057.64**. None of these exactly equal the brief's ~€117.6M — see Verdict caveat above.

## Field mapping

| Our field | BDAP source | Notes |
|---|---|---|
| `bilancio.anno` | `Esercizio Finanziario` (col 1) | "2024" |
| `bilancio.spesa_corrente` | `Quadro Generale Riassuntivo Spese`, `Codice Titolo Spese Arconet = "01"`, `Pre. in CC 1Anno` | 89,557,064.13 |
| `bilancio.spesa_capitale` | same file, `Codice Titolo = "02"` | 68,734,993.51 |
| `bilancio.totale_previsione` | Sum of Titolo I+II (or all titoli minus conto-terzi/anticipazioni, TBD which convention to standardize on) | 158.3M (I+II) vs 161.1M (excl. M99/M60) — reconcile against comune's own published total |
| `bilancio.missioni[].codice` | `Codice Missione Arconet` (col 16), `..._Spese Riepilogo Missioni_SICILIA.csv` | "01".."99", ARCONET standard mission codes |
| `bilancio.missioni[].descrizione` | `Descrizione Missione Arconet` (col 17) | Italian label, ARCONET standard wording |
| `bilancio.missioni[].importo` | `Previsioni in CC 1 Anno` (col 20) | Competenza, year 1 = target year; col 21/22 give year 2/3 of the triennio for a forward-looking view |
| Entity filter key | `Denominazione Soggetto` (col 5) = `"COMUNE DI RAGUSA"`, or `Codice BDAP = "664042930448245002"` | Must not rely on `Codice Comune` alone (collides with co-located province/IACP/ATI entities) |
| ISTAT code (088009) | `Codice Provincia` (088) + `Codice Comune` (009), concatenated | Not a native field |

## License / format / size

- **Format**: CSV, `;`-delimited, **ISO-8859-1 encoded** (not UTF-8 — must `iconv`), CRLF line endings, quoted fields. This is the "Schemi di bilancio" (SDB) export, which is the human/machine-readable derivative of the underlying XBRL filings — **XBRL parsing is not required** for this use case, OpenBDAP does the XBRL→CSV conversion server-side already.
- **Size**: regional ZIP for Sicilia = 6.0 MB compressed / ~48 MB uncompressed across 64 files (mostly redundant PDF renderings of each schema + the CSV equivalents). The specific CSV needed (`Spese Riepilogo Missioni`) is ~1.8 MB uncompressed for all ~200+ Sicilian entities combined; the Ragusa-only slice is 19 rows / ~3 KB after filtering. Cheap to fetch, parse, and cache.
- **License**: the brief assumed **IODL 2.0**. Live-checked on `bdap-opendata.rgs.mef.gov.it/catalog`: the license actually displayed there is **"CC BY - Libero riuso citando la fonte"** (CC BY, free reuse with attribution) — not IODL 2.0. No explicit license statement was found on the `openbdap.rgs.mef.gov.it/Datasets_FET/...` file-download path itself (it's outside the CKAN catalog), but OpenBDAP's general terms (footer / "Termini e Condizioni" page) apply the same open-reuse posture as the rest of MEF/RGS open data. Treat as CC BY and cite "BDAP — Banca Dati delle Amministrazioni Pubbliche, RGS-MEF" as the source.
- **Auth**: none. All requests above (GetDocumentsYears, GetDocuments, the ZIP itself) returned data/200 with a plain unauthenticated `curl`, no headers, no cookies, no API key.
- **Coverage**: `previsione` and `rendiconto` (consuntivo) both available 2016–2026 (previsione) / 2016–2025 (rendiconto) at time of testing, `consolidato` also listed as a type (not tested). This gives multi-year trend capability essentially for free.

## Gotchas

1. **Wrong hostname trap**: `bdap-opendata.mef.gov.it` (no `rgs`) does not resolve at all — DNS failure, not a 404. Only `bdap-opendata.rgs.mef.gov.it` (CKAN catalog) and `openbdap.rgs.mef.gov.it` (FET portal + file downloads) are live.
2. **The CKAN catalog is a red herring for this use case.** It's real and functional (verified `package_search`/`package_list` work), but it does not index per-comune harmonized bilancio data — it's dominated by State-budget (`Bilancio dello Stato`), SIOPE cash-flow, and "enti vigilati" datasets. Don't spend adapter-build time trying to make CKAN search find Ragusa's bilancio — it won't; go straight to the `Datasets_FET` bulk files.
3. **Bundles are regional, not per-comune.** There is no `?comune=Ragusa` download param — every fetch pulls in all ~200+ Sicilian local entities and must be filtered client-side. Fine for a cache-and-filter adapter (6MB is trivial), but means the adapter can't do a narrow per-request fetch; it should fetch+cache the whole Sicilia bundle per year and re-filter, or better, extract Ragusa's rows once at ingestion time and store just that slice.
4. **Entity-name collision within the comune's own territorial code**: filtering by `Codice Comune` alone pulls in the Provincia (Libero Consorzio), the housing authority (IACP), and the water authority (ATI), all coded under Ragusa's territorial code. Must filter on `Denominazione Soggetto = "COMUNE DI RAGUSA"` or the stable `Codice BDAP` identifier.
5. **Encoding**: source files are ISO-8859-1, not UTF-8 — accented characters (à, è, ì) will mojibake without explicit `iconv`/decode step. Filenames inside the ZIP also contain non-ASCII characters that some zip tools mangle (harmless, just extract by exact original name or use `-j` junk-paths + globbing).
6. **`type=consuntivo` fails (HTTP 500)** — the correct literal is `rendiconto`. Easy trap since "consuntivo" is the everyday Italian term and "rendiconto" is the ARCONET/technical term; the UI itself uses `rendiconto` internally despite showing "Consuntivo" as a button label.
7. **Total reconciliation**: no single BDAP figure matched the brief's ~€117.6M out of the box. Titolo I+II gives €158.3M; excluding all "technical" missions (M20/50/60/99) from the mission sum gives €150.3M. Don't assume any one BDAP total is "the" published headline figure without checking against the comune's own bilancio approval documents — BDAP's CC-1°-anno figures are the *as-transmitted* initial previsione, which can predate later variazioni di bilancio.
8. **`GetDocuments` `country` param is actually a region name** ("Sicilia"), not ISTAT-code-based and not a single comune — naming in the JS source is misleading (`country=Ragusa` would silently return `[]`, not an error — tested, confirmed empty array).

## Adapter notes

Recommended ingestion approach (batch/cache, not live-per-request):
```bash
# 1. Discover available years (cheap, cache long-term)
curl -s "https://openbdap.rgs.mef.gov.it/fet/GetDocumentsYears?type=previsione"

# 2. Get the ZIP URL for the target year + region (Sicilia)
curl -s "https://openbdap.rgs.mef.gov.it/fet/GetDocuments?type=previsione&year=2024&country=Sicilia"

# 3. Download + extract only the two CSVs needed
curl -L -o previsione_sicilia_2024.zip "https://openbdap.rgs.mef.gov.it/Datasets_FET/previsione/2024/2024_Previsione%20-%20Schemi%20di%20bilancio_SICILIA.zip"
unzip -j previsione_sicilia_2024.zip \
  "2024_Bilancio di Previsione SDB Spese Riepilogo Missioni_SICILIA.csv" \
  "2024_Bilancio di Previsione SDB Quadro Generale Riassuntivo Spese_SICILIA.csv"

# 4. Convert encoding, filter to Comune di Ragusa, parse
iconv -f ISO-8859-1 -t UTF-8 "...Riepilogo Missioni_SICILIA.csv" | \
  awk -F';' '$5=="\"COMUNE DI RAGUSA\""'
```
This is a straightforward batch job (download once per year when a new bilancio is published, e.g. via a scheduled/cron ingestion, not a live per-page-load API call) — a Node/Python script using `csv-parse`/`pandas` with explicit `latin1` decoding, filtering on the `Denominazione Soggetto` column, and mapping `Codice Missione Arconet` → our mission taxonomy is entirely feasible within normal Phase 2 effort. No XBRL library, no authentication flow, no headless browser needed.

Recommendation: **do not** fall back to curated/seed-only data for `bilancio` — this source is usable. Suggested effort: small (a few hours) to build the fetch+filter+map adapter, plus a manual reconciliation pass to decide which BDAP total (Titolo I+II vs "excl. technical missions") should back the headline `totale_previsione` figure shown in the UI, ideally cross-checked once against the Comune di Ragusa's own published delibera di approvazione del bilancio for 2024 if a canonical ~€117.6M figure needs to be matched exactly.
