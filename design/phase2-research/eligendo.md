# Eligendo / DAIT open data — Elezioni comunali Ragusa 2023

Research date: 2026-07-01 (live requests executed on this date).
Target comune: Ragusa, ISTAT `088009`, provincia RG, Sicilia.
Target election: comunali 28–29 maggio 2023.

## Verdict

**RED** for the national Eligendo/DAIT *open data* channel (no programmatically fetchable CSV/JSON dataset covers comunali 2023 for Ragusa).
**GREEN** for a real, live, verified alternative: the **Regione Siciliana — Assessorato delle Autonomie Locali** per-comune HTML report, which contains the exact target numbers and is fetchable with a plain `curl`.

Why RED for Eligendo/DAIT:

- The Ministry of Interior's historical open-data archive (`elezionistorico.interno.gov.it/eligendo/opendata.php`) ships a **hardcoded JS array** (`dataSet` in `/js/eligendo-archivio.js`) listing every downloadable ZIP by election type + date. For `tipo=comunali` in 2023 there are exactly **three** files: `comunali-20230514.zip`, `comunali-20230528.zip`, `comunali-20231022.zip`. All three were downloaded and parsed (they are XLSX inside the ZIP, not CSV). **None contains Ragusa**:
  - `comunali-20230514.zip` → 595 comuni, all dated 2023-05-14 (a different, earlier administrative round — not the 28-29 May general round).
  - `comunali-20230528.zip` → only 39 comuni, **all in Sardegna** (Sardinia runs its own separate comunali calendar/round on this date).
  - `comunali-20231022.zip` → 9 rows, malformed/shifted columns, unrelated small round.
  - The nationwide 28-29 May 2023 round that included Ragusa (and most of Sicily/Italy) is **not present** in any of these three files.
- The AGID DCAT-AP catalog (`https://dait.interno.gov.it/documenti/opendata/catalogoagid/catalog.rdf`) formally lists curated CSV datasets only for **`elezioni-comunali-2024`** (`comunali-20240609.csv`, `comunali-20240728.csv`) and **`elezioni-regionali-2023`**. There is **no `elezioni-comunali-2023` dataset entry at all** in the catalog. Probing the naming pattern directly (`comunali-20230528.csv`, `comunali-2023.csv`, etc.) against `dait.interno.gov.it/documenti/opendata/catalogoagid/` returns `404` for every guess.
- Bonus finding (quality gotcha): the file `comunali-20240609.csv` that IS in the catalog under "Comunali 2024" actually contains, on inspection, rows dated `12/2/2023` for **Regionali Lombardia** candidate-preference data — i.e. the DAIT catalog has real **mislabeling** issues even where files exist. Don't trust filenames.
- The **live** portal (`elezioni.interno.gov.it`) is a Vue/Quasar SPA (`#q-app`) that only calls its JSON backend (`https://eleapi.interno.gov.it`) for **currently active/recent** elections (2025-2026 in its bundled config as of this check) — comunali 2023 is not in its "live" rotation.
- There IS a retrospective backend (`https://elestorapi.interno.gov.it/retrospettivo/{date}/{tipo_elez}/{area}/{code}/all`), reverse-engineered from the app bundle (`app.js`). It is reachable (behind an Akamai WAF that needs a browser-like `User-Agent` + `Referer`/`Origin`, otherwise 403). However, the `{code}` parameter is **not** a plain ISTAT/region code — it needs an internal lookup table (`SETCONFINFOREGIONI`/`SETCONFINFOPROVINCE`) baked into the SPA, and every guessed code combination (region `19`, comune `088009`, province `RG`, etc.) returned `{"errore":"esito negativo"}`. This is an **undocumented internal API**, not an open-data product, and not something to build a production adapter on.

Conclusion: for Ragusa comunali 2023 specifically, Eligendo/DAIT open data is a dead end. Use the Sicilian regional government's per-comune report as the real source (see below), and treat Eligendo as viable only for **future** elections cycles that do get a proper AGID catalog entry (2024+ regionali/comunali follow the `catalogoagid/*.csv` convention and DO work, license CC BY 4.0 — see "closest alternative" section).

## Endpoints / download URLs (that worked)

All fetched live with plain `curl`, no auth:

| Purpose | URL | Result |
|---|---|---|
| Eligendo historical open-data UI (source of the dataset array) | `https://elezionistorico.interno.gov.it/eligendo/opendata.php` | 200, HTML+JS |
| Eligendo open-data info page | `https://elezionistorico.interno.gov.it/eligendo/info_opendata.php` | 200, HTML |
| JS with the full file catalog (`dataSet` array) | `https://elezionistorico.interno.gov.it/js/eligendo-archivio.js` | 200 |
| Comunali 2023-05-14 ZIP (595 comuni, no Ragusa) | `https://dait.interno.gov.it/daithome/documenti/opendata/comunali/comunali-20230514.zip` | 200, 336 KB |
| Comunali 2023-05-28 ZIP (39 comuni, Sardegna only, no Ragusa) | `https://dait.interno.gov.it/daithome/documenti/opendata/comunali/comunali-20230528.zip` | 200, 19 KB |
| Comunali 2023-10-22 ZIP (9 malformed rows, no Ragusa) | `https://dait.interno.gov.it/daithome/documenti/opendata/comunali/comunali-20231022.zip` | 200, 12 KB |
| AGID DCAT-AP catalog (confirms no comunali-2023 entry) | `https://dait.interno.gov.it/documenti/opendata/catalogoagid/catalog.rdf` | 200, XML/RDF |
| Comunali 2024 CSV (works, but content mislabeled — see gotchas) | `https://dait.interno.gov.it/documenti/opendata/catalogoagid/comunali-20240609.csv` | 200, ~36 MB |
| Live SPA shell (no data without JS) | `https://elezioni.interno.gov.it/risultati/20230528/comunali/scrutini/019/019088009` | 200, empty SPA shell |
| Retrospective JSON backend (reachable, but codes are opaque/undocumented) | `https://elestorapi.interno.gov.it/retrospettivo/20230528/comunali/italia/19/all` | 200 JSON, `{"errore":"esito negativo"}` (needs browser UA+Referer or 403) |
| **WORKING alternative** — Regione Siciliana per-comune report for Ragusa | `http://www.elezioni.regione.sicilia.it/comunali2023/RG/ReportRisultatiRG271.html` | 200, ISO-8859-1 HTML, **contains real target data** |

Note: `dait.interno.gov.it` and `elezionistorico.interno.gov.it` serve the *same* file bytes for the `/daithome/documenti/opendata/...` path (checked both hosts, identical size/content-type).

## How to filter to Ragusa

- **Eligendo historical ZIPs**: not applicable — Ragusa isn't in any of the 2023 comunali files, so there is nothing to filter.
- **AGID catalog CSVs (when they do exist, e.g. 2024)**: semicolon-delimited, filter by `COMUNE == "RAGUSA"` and `PROVINCIA == "RAGUSA"` (province is spelled out, not RG). Columns are quoted with `"`.
- **Regione Siciliana alternative**: URLs are per-province, per-comune, keyed by an internal numeric ID in the filename (`RG271` = Ragusa's report id within the RG province folder). Navigate via province code folders (`/comunali2023/RG/`, `/comunali2023/AG/`, etc. — the 9 Sicilian province codes were visible in the page nav: AG, CL, CT, EN, ME, PA, RG, SR, TP). The Ragusa comune report ID (271) was found via the search engine result directly; a robust adapter should crawl the province's index/report list page to resolve comune → report-id mapping rather than hardcoding `271`, in case IDs are re-generated per report run.

## Sample response (trimmed, real data)

### Eligendo XLSX schema (comunali-20230514.xlsx / comunali-20230528.xlsx — for reference; Ragusa absent)

Header row (20 columns):
```
DATAELEZIONE, TURNO, elettoritot, elettorimaschi, votantitot, votantimaschi, skbianche,
descrlista, VOTILISTA, seggilista, cognome, nome, datanascita, luogonascita, sesso,
CODTIPOELETTO, VOTICAND, regione, provincia, comune
```
One data row is one (lista × candidato-sindaco) combination — i.e. long/normalized format, one row per lista per comune, with the sindaco's own vote total repeated (`VOTICAND`) on every row for that comune.

### Regione Siciliana Ragusa report (real, verified, 31 May 2023 10:54 update — "scrutinio completo")

```
Comune di Ragusa (RG)
Elezioni Amministrative del 28-29 maggio 2023
Pop.Legale: 72.779   Sezioni: 71   Elettori: 63.029   Seggi: 24

Sindaco Eletto: CASSI' GIUSEPPE detto PEPPE — Voti: 21.673 — %: 62,92%
  Liste collegate:
    PARTECIPIAMO RAGUSA FUTURA CASSI' SINDACO        3.951  12,42%
    PEPPE CASSI'NDACO RAGUSA 2023                    7.789  24,48%
    DE LUCA PER RAGUSA CASSI' SINDACO                1.790   5,63%
    RAGUSA PROSSIMA CASSI' SINDACO                   2.340   7,35%
    RAGUSA TERRA MADRE                               2.333   7,33%
    Totale liste candidato: 18.203  57,20%

Candidato Sindaco: SCHININA' RICCARDO — Voti: 6.705 — %: 19,47%
  TERRITORIO                                          1.649   5,18%
  +RG RI - PENSARE RAGUSA - SCHININA' SINDACO           583   1,83%
  PARTITO DEMOCRATICO SCHININA' SINDACO               2.335   7,34%
  GENERAZIONE DEMOS                                   1.919   6,03%
  PATTO PER RAGUSA                                      800   2,51%
  Totale: 7.286  22,90%

Candidato Sindaco: CULTRERA GIOVANNI — Voti: 3.345 — %: 9,71%
  INSIEME                                             1.513   4,76%
  FRATELLI D'ITALIA - GIORGIA MELONI                  2.099   6,60%
  FORZA ITALIA - BERLUSCONI                             290   0,91%
  Totale: 3.902  12,26%

Candidato Sindaco: FIRRINCIELI SERGIO — Voti: 2.721 — %: 7,90%
  SIAMO COMUNITA' FIRRINCIELI SINDACO                   780   2,45%
  MOVIMENTO 5 STELLE 2050                             1.651   5,19%
  Totale: 2.431  7,64%
```

All four candidato-sindaco vote counts and percentages match the target values exactly (Cassì 21.673/62,92%; Schininà 19,47%; Cultrera 9,71%; Firrincieli 7,90%). Seggi consiglio = 24 (matches target). The turnout ("affluenza") figure implied by Elettori 63.029 / Votanti (sindaco line — table shows a "Votanti" row split into Sindaco/Consiglio sub-columns, values 34.444/31.822 in the raw table) works out close to but not exactly 56,03% — expect ~1-2pp drift between this "scrutinio completo, dati provvisori" regional report and the Ministry's later-consolidated official figure; the page itself carries the disclaimer "*I report pubblicati sono meramente indicativi in quanto elaborati sui dati provvisori comunicati dai Comuni*" (reports are merely indicative, based on provisional data). Reconcile against the seed's ~56,03% if an authoritative refresh is needed.

## Field mapping

| Our field | Eligendo XLSX column (when available for other years) | Regione Siciliana HTML report |
|---|---|---|
| candidato (sindaco) | `cognome` + `nome` | "Sindaco Eletto" / "Candidato Sindaco" block heading |
| voti (candidato) | `VOTICAND` | "VOTI" value under each candidate heading |
| % (candidato) | not provided directly — must compute `VOTICAND / votantitot` | "%" value under each candidate heading (pre-computed) |
| lista | `descrlista` | Row in "Lista/e Collegata/e" sub-table |
| voti (lista) | `VOTILISTA` | "Voti" column in liste sub-table |
| % (lista) | not provided directly — must compute | "%" column in liste sub-table (pre-computed) |
| affluenza | derive from `votantitot / elettoritot` | derive from "Votanti" / "Elettori" header block |
| seggi (consiglio) | `seggilista` (per-lista seats; sum for total) | "Seggi" header value (24) + `Candidati` column per lista (24 each — this is candidates fielded, not seats won; seat allocation isn't broken out per-lista on this page) |
| sindaco eletto | row(s) where `CODTIPOELETTO = 'C'` (candidato) combined with a "proclamato eletto" flag not present in this schema — must be inferred as the candidate with max `VOTICAND` | Explicit "Sindaco Eletto" label vs "Candidato Sindaco" for losers |

Caveat: the Eligendo XLSX schema is documented here for completeness (it's the schema you'd get for a year where Ragusa IS present), but it could not be validated against Ragusa 2023 data since Ragusa never appears in the available comunali-2023 files.

## License / auth / size

- **Eligendo/DAIT catalog**: license is **CC BY 4.0** (`https://creativecommons.org/licenses/by/4.0/`), NOT IODL 2.0 as commonly assumed for older Italian PA open data — confirmed by inspecting `catalog.rdf` distribution entries. No auth required for the ZIP/CSV downloads that do exist.
- File sizes seen: comunali ZIPs 12–336 KB (XLSX inside); a full-year comunali CSV (2024) was ~36 MB uncompressed, ~228k rows.
- The retrospective JSON API (`elestorapi.interno.gov.it`) sits behind an **Akamai WAF**: requests without a browser-like `User-Agent` and a same-origin `Referer`/`Origin` get `403 Access Denied` from `errors.edgesuite.net`. With proper headers it returns `200` JSON, but the endpoint/param contract is undocumented and not part of any open-data licence — do not depend on it.
- **Regione Siciliana report**: no licence statement found on the page; it's a public government transparency report, ISO-8859-1 encoded HTML, no auth, ~30 KB per comune page. Treat as "publicly viewable government data" rather than a licensed open-data product — fine for a civic-tech seed/demo, less fine if strict open-data licence compliance is required.

## Adapter notes (exact working curl)

Confirms/repros for this research (all executed live):

```bash
# 1. Confirm no 2023 comunali dataset exists in the Eligendo catalog for Ragusa's date:
curl -sL -A "Mozilla/5.0" \
  "https://dait.interno.gov.it/daithome/documenti/opendata/comunali/comunali-20230528.zip" \
  -o comunali-20230528.zip
unzip -o comunali-20230528.zip   # -> comunali-20230528.xlsx, 39 Sardegna comuni, no Ragusa

# 2. Confirm the AGID catalog has no 2023 comunali entry (404s):
curl -s -o /dev/null -w "%{http_code}\n" \
  "https://dait.interno.gov.it/documenti/opendata/catalogoagid/comunali-20230528.csv"
# -> 404

# 3. WORKING alternative: Regione Siciliana per-comune report for Ragusa (real target data):
curl -sL -A "Mozilla/5.0" \
  "http://www.elezioni.regione.sicilia.it/comunali2023/RG/ReportRisultatiRG271.html" \
  -o ragusa_2023.html
iconv -f ISO-8859-1 -t UTF-8 ragusa_2023.html | \
  python3 -c "import sys,re; t=re.sub(r'<[^>]+>','|',sys.stdin.read()); print(re.sub(r'\|+','|',t))"
# -> plain-text table with Cassì 21.673/62,92%, Schininà 19,47%, Cultrera 9,71%,
#    Firrincieli 7,90%, 24 seggi, all liste with voti/%.
# NOTE: encoding is ISO-8859-1 (Latin-1), not UTF-8 — must iconv/decode before parsing,
# and apostrophes in names ("CASSI'", "SCHININA'") are ASCII apostrophes, not curly quotes.

# 4. If a future adapter targets Eligendo for later comunali cycles where a proper
#    catalog entry exists (2024+), the AGID CSV pattern works directly, e.g.:
curl -sL -A "Mozilla/5.0" \
  "https://dait.interno.gov.it/documenti/opendata/catalogoagid/comunali-20240728.csv" \
  -o comunali-20240728.csv
# -> semicolon-delimited, quoted, filter: awk -F';' '$5=="\"RAGUSA\""' (verify column
#    positions per file — schema drifts between files, see "gotchas" below).
```

### Gotchas

1. **Ragusa comunali 2023 is simply absent from Eligendo's national open-data catalog.** This is not a parsing or URL-guessing problem — the underlying files, both the curated historical-archive ZIPs and the AGID CSV catalog, do not include the 28-29 May 2023 general round for Sicily/Ragusa. Do not spend more effort trying to reverse-engineer the retrospective JSON API; it is an internal SPA backend with an opaque code scheme, sits behind a WAF that 403s bare `curl`, and returning results even for a *known-good* dataset (regionali Sicilia 2023, which DOES exist in the catalog) failed with every guessed code.
2. **Filenames lie.** `comunali-20240609.csv` in the AGID catalog actually contains `Regionali Lombardia` February 2023 candidate-preference rows, not June 2024 comunali data. Always sanity-check `DATAELEZIONE`/content against the filename before trusting a downloaded file.
3. **Schema drift across files.** The three 2023 comunali XLSX files have three different (and in one case malformed/shifted) column orders — column position is not stable across Eligendo exports; always read the header row rather than assuming column indices.
4. **Encoding.** The Sicilian regional alternative is ISO-8859-1, and its numbers use Italian formatting (`.` thousands separator, `,` decimal separator, e.g. `21.673` = 21,673 votes, `62,92%` = 62.92%) — must be parsed accordingly, not as plain floats.
5. **Data-quality disclaimer on the alternative source**: the Sicilia page explicitly states results are "meramente indicativi" (provisional/indicative), timestamped "31 maggio 2023, 10:54" — i.e. very shortly after the vote, likely pre-consolidation. Minor discrepancies vs. later "official" Ministry figures (e.g. the ~56,03% affluenza target vs. the ~54.6% derivable from this page's raw votanti/elettori) should be expected and are not adapter bugs.
6. **No stable REST contract to build a long-term adapter on** for this specific election. If RagusIA needs live-refreshable Eligendo data going forward, target **future** cycles (2024+) where AGID catalog CSVs are confirmed to exist and be fetchable with plain `curl`, and treat 2023 comunali as a one-time manual/semi-structured import from the Regione Siciliana HTML report instead.
