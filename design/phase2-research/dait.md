# DAIT — Anagrafe degli Amministratori Locali e Regionali (Comune di Ragusa)

Research date: 2026-07-01. Live-verified with `curl`.

## Verdict: GREEN

The DAIT (Dipartimento Affari Interni e Territoriali, Ministero dell'Interno) open-data
CSV export is a real, live, no-auth, no-key dataset that contains the **current sindaco,
giunta (assessori) and consiglio comunale (consiglieri)** for Comune di Ragusa, updated
after every election/variation and re-published periodically (latest snapshot:
**06/06/2026**). Live `curl` fetch of the per-province file returned all 32 expected
office-holders for Ragusa (1 sindaco + 7 assessori + 24 consiglieri), matching the known
mandate (Giuseppe "Peppe" Cassì, 2023–2028) exactly on name, election date and
entrata-in-carica date.

Caveat lowering it from an unconditional green: there is **no explicit
policy-portfolio ("delega") field** — e.g. "Assessore ai Lavori Pubblici" is NOT in the
data. Only two structural roles are flagged via the `incarico` column: `Vicesindaco`
and `Presidente del consiglio`. If RagusIA's organigramma needs assessore portfolios
(deleghe), those must keep coming from the seed/manual curation or from the Comune's own
website — DAIT only gives names, ruolo (Sindaco/Assessore/Consigliere) and the two special
`incarico` flags above.

## Endpoints / download URLs

Base open-data listing page (HTML, lists all files):
`https://dait.interno.gov.it/elezioni/open-data/amministratori-locali-e-regionali-in-carica`

Direct CSV downloads (all confirmed live, HTTP 200, no auth, plain `curl` with default UA
works fine):

| Dataset | URL | Size (live) | Scope |
|---|---|---|---|
| **Per-provincia — RAGUSA (RECOMMENDED)** | `https://dait.interno.gov.it/documenti/provincia_di_ragusa.csv` | 56,975 bytes | all 12 comuni of provincia di Ragusa |
| Sindaci in carica (Italia) | `https://dait.interno.gov.it/documenti/sindaciincarica.csv` | ~1.99 MB | mayors only, whole Italy |
| Amministratori Comunali (Italia) | `https://dait.interno.gov.it/documenti/ammcom.csv` | ~26.68 MB | all municipal admins, whole Italy (sindaco+assessori+consiglieri) |
| Amministratori Provinciali | `https://dait.interno.gov.it/documenti/ammprov.csv` | 263.86 KB | provincial |
| Amministratori Regionali | `https://dait.interno.gov.it/documenti/ammreg.csv` | 187.05 KB | regional |
| Amministratori Metropolitani | `https://dait.interno.gov.it/documenti/ammmetropolitani.csv` | 53.14 KB | città metropolitane |
| Organi straordinari (commissariati) | `https://dait.interno.gov.it/documenti/organistraordinariincarica.csv` | 18.89 KB | comuni sciolti/commissariati |
| Maggior organo (sindaco+presidenti) | `https://dait.interno.gov.it/documenti/maggiororgano.csv` | 1.73 MB | Italy |

There are also **110 per-province files** (one per Italian provincia), following the
pattern `https://dait.interno.gov.it/documenti/provincia_di_<slug>.csv`
(e.g. `provincia_di_ragusa.csv`, `provincia_di_catania.csv`,
`provincia_di_barletta-andria-trani.csv`). These are the cheapest way to get a single
provincia (56 KB vs 26.68 MB for all of Italy).

Historical annual snapshots (as of 31 Dec of each year, back to 1986) live under distinct
pages, e.g.:
`https://dait.interno.gov.it/elezioni/open-data/dati-amministratori-locali-in-carica-al-31-dicembre-2025`
— not needed for Phase 2 (we want current office-holders), but useful later for
"storico sindaci" features.

## Filter to Ragusa

Two equally valid options:

1. **Preferred**: download `provincia_di_ragusa.csv` directly (56 KB) — it already
   contains only the 12 comuni of provincia di Ragusa, so filtering is a single `awk`/`grep`
   on `denominazione_comune == "RAGUSA"` (or `codice_comune == "0090"`).
2. Fallback (if a per-province file is ever missing/renamed): download `ammcom.csv`
   (26.68 MB, all of Italy) and filter on the composite key
   `codice_regione="19"` AND `codice_provincia="065"` AND `codice_comune="0090"`.

**Important gotcha on ISTAT codes**: DAIT does NOT use the flat 6-digit ISTAT comune code
(088009) directly in a single column. Instead it splits it into three columns:
`codice_regione` ("19" = Sicilia), `codice_provincia` ("065" = Ragusa) and `codice_comune`
("0090" = Ragusa, a code local to the province, NOT the last 3 digits of 088009). Do not
`grep` for the literal string "088009" — it will not match. Match instead on
`denominazione_comune == "RAGUSA"` combined with `sigla_provincia == "RG"` (safest, avoids
homonym comuni like "Ragusa" appearing as birthplace text elsewhere), or precompute the
`codice_regione`/`codice_provincia`/`codice_comune` triple once via the ISTAT
regione/provincia/comune lookup tables if you need robust joins across the whole dataset.

Verified filter command:
```bash
curl -sL "https://dait.interno.gov.it/documenti/provincia_di_ragusa.csv" \
  | awk -F';' '$4=="\"RAGUSA\"" && $5=="\"RG\""'
```

## Sample response (real, trimmed Ragusa rows)

First 3 lines of the file are a title/metadata preamble, not header:
```
"Amministratori Comunali - elenco completo provincia di ragusa"
"Aggiornato al 06/06/2026"
"codice_regione";"codice_provincia";"codice_comune";"denominazione_comune";"sigla_provincia";"popolazione_censita_alla_data_elezione";"cognome";"nome";"sesso";"data_nascita";"luogo_nascita";"livello_carica";"descrizione_carica";"incarico";"data_elezione";"data_entrata_in_carica";"lista_appartenenza/collegamento";"titolo_studio";"professione"
```

Real Ragusa rows (32 total; showing sindaco + 2 assessori incl. vicesindaco + 2 consiglieri
incl. presidente del consiglio):

```
"19";"065";"0090";"RAGUSA";"RG";"72779";"CASSI'";"GIUSEPPE";"M";"11/04/1963";"CATANIA (CT)";"10";"Sindaco";;"28/05/2023";"01/06/2023";"PEPPE CASSI'NDACO RAGUSA 2023";"Laurea Magistrale";

"19";"065";"0090";"RAGUSA";"RG";"72779";"ADAMO";"ELVIRA";"F";"06/10/1965";"RAGUSA (RG)";"50";"Assessore";;"28/05/2023";"09/06/2023";;"Laurea Triennale";"SPECIALISTI IN SCIENZE SOCIALI E TECNICI DEI SERVIZI SOCIO-ASSISTENZIALI"

"19";"065";"0090";"RAGUSA";"RG";"72779";"GIUFFRIDA";"GIOVANNI";"M";"30/10/1973";"RAGUSA (RG)";"50";"Assessore";"Vicesindaco";"28/05/2023";"09/06/2023";;"Laurea Magistrale";"Ingegneri (meccanici, metallurgico-minerari, ...)"

"19";"065";"0090";"RAGUSA";"RG";"72779";"ANTOCI";"MARCO";"M";"29/01/1989";"RAGUSA (RG)";"120";"Consigliere";;"28/05/2023";"01/06/2023";"PEPPE CASSI'NDACO RAGUSA 2023";"Laurea Magistrale";

"19";"065";"0090";"RAGUSA";"RG";"72779";"ILARDO";"FABRIZIO";"M";"16/06/1967";"RAGUSA (RG)";"120";"Consigliere";"Presidente del consiglio";"28/05/2023";"01/06/2023";"PEPPE CASSI'NDACO RAGUSA 2023";"Laurea Magistrale";"IMPIEGATI DI AMMINISTRAZIONI, ORGANI ED ENTI PUBBLICI (...)"
```

Full breakdown for Comune di Ragusa (verified counts):

| Ruolo | Count | Notes |
|---|---|---|
| Sindaco | 1 | Giuseppe Cassì, eletto 28/05/2023, in carica dal 01/06/2023 |
| Assessore | 7 | includes Giovanni Giuffrida flagged `incarico = "Vicesindaco"` |
| Consigliere | 24 | includes Fabrizio Ilardo flagged `incarico = "Presidente del consiglio"`; one row (Sergio Firrincieli) has `descrizione_carica = "Consigliere candidato sindaco"` (i.e. runner-up mayoral candidate seated as councillor — a known Italian local-government mechanic, still a Consigliere for our purposes) |
| **Total row count for comune 0090/RAGUSA/RG** | **32** | matches sindaco(1) + giunta(7) + consiglio(24) exactly |

Note: 7 assessori + 1 sindaco = 8, consistent with an 8-person giunta (typical for a comune
this size); 24 consiglieri matches the number requested in the task exactly, confirming
data freshness/correctness.

## Field mapping → organigramma

| DAIT column | Example value | Maps to |
|---|---|---|
| `cognome` + `nome` | `"CASSI'"` + `"GIUSEPPE"` | `nome` (concat, Title-case; note apostrophe encoding `CASSI'` for "Cassì" — see gotchas) |
| `descrizione_carica` | `"Sindaco"` / `"Assessore"` / `"Consigliere"` / `"Consigliere candidato sindaco"` | `ruolo` — bucket the last one into `Consigliere` |
| `incarico` | `"Vicesindaco"` | boolean flag `vicesindaco: true` on that assessore row |
| `incarico` | `"Presidente del consiglio"` | `presidenteConsiglio` — name comes from the Consigliere row where this is set |
| `livello_carica` | `"10"`=Sindaco, `"50"`=Assessore, `"120"`=Consigliere | numeric code, redundant with `descrizione_carica`, useful as a stable enum key |
| `sesso` | `"M"` / `"F"` | optional, not currently in schema |
| `data_elezione` | `"28/05/2023"` | mandate start reference (election date) |
| `data_entrata_in_carica` | `"01/06/2023"` | actual swearing-in date (can differ per assessore, e.g. giunta sworn in 09/06/2023, a week after the sindaco) |
| `lista_appartenenza/collegamento` | `"PEPPE CASSI'NDACO RAGUSA 2023"` | civic list / coalition name — only populated for sindaco's own list + most consiglieri's list, often empty for assessori (technical/external appointees) |
| `titolo_studio`, `professione` | e.g. `"Laurea Magistrale"`, `"Ingegneri..."` | optional bio enrichment, not core to organigramma |
| **deleghe (portfolio, e.g. "Assessore ai Lavori Pubblici")** | **NOT PRESENT** | must stay sourced from seed data / Comune di Ragusa website scraping — DAIT has no equivalent field |
| **consiglieri count** | derived: `COUNT(descrizione_carica LIKE 'Consigliere%')` | = 24, confirmed live |

## License / auth / size

- **Auth**: none. Plain HTTPS GET, no API key, no cookies, works with bare `curl` (no
  User-Agent needed — verified both with and without a UA header, both returned HTTP 200).
- **License**: Not explicitly stamped with an IODL/CC badge on the specific pages checked
  (`/elezioni/open-data/amministratori-locali-e-regionali-in-carica` and
  `/elezioni/anagrafe-amministratori`). The site runs on the "Designers Italia" /
  Bootstrap-Italia template used by most Italian PA sites (`<footer class="it-footer">`
  markers present), which by AGID convention defaults to **IODL 2.0** unless stated
  otherwise, but this is an *inference*, not a page-level confirmation — recommend citing
  "Ministero dell'Interno — Dipartimento per gli Affari Interni e Territoriali" as source
  regardless, per general PA open-data etiquette, and re-check for an explicit license
  badge before any commercial/redistribution use beyond RagusIA's own display.
- **Size**: `provincia_di_ragusa.csv` = 56,975 bytes (56 KB) — trivially small, safe to
  fetch on every build/cron. National `ammcom.csv` = 26.68 MB (only needed as a fallback).
- **Update cadence**: "Aggiornato al 06/06/2026" embedded in the file's own header row
  (row 2). DAIT states the flow is: post-election update → comuni submit assessori/
  consiglieri electronically → prefetture (uffici territoriali di governo) validate →
  published. No fixed cron schedule is documented; treat as "check periodically, cache
  aggressively" (e.g. daily/weekly cron is more than sufficient given council composition
  changes rarely between elections).
- **Format**: CSV, `;`-delimited, all fields double-quoted, `\n` line endings, encoding is
  **UTF-8/US-ASCII in practice** (verified via `file -I`: `charset=us-ascii`) — despite the
  common expectation of latin-1/win-1252 for older Italian PA exports, this 2026 file is
  plain ASCII (no accented characters appear raw; accents are avoided/transliterated, e.g.
  "Cassì" is written `CASSI'` with an ASCII apostrophe, not `Cassì` with true `ì`). Still,
  **decode defensively as UTF-8 with a latin-1 fallback** — historical-year snapshot files
  (pre-2020) are known in the wild to use `ISO-8859-1`, so a single hard-coded charset
  would break if the code is later pointed at an older snapshot URL.
- Content-Type header returned: `text/csv`. `Last-Modified` header present and accurate
  (`Sat, 06 Jun 2026 08:43:39 GMT`), useful for conditional `curl --time-cond`/ETag-style
  caching (no ETag header was present, only `Last-Modified` + `Cache-Control: must-revalidate, max-age=300`).

## Adapter notes (exact working curl)

```bash
# 1. Fetch only the Ragusa provincia file (56 KB, cheapest)
curl -sL "https://dait.interno.gov.it/documenti/provincia_di_ragusa.csv" -o provincia_di_ragusa.csv

# 2. Extract header (line 3) to confirm schema before parsing
sed -n '3p' provincia_di_ragusa.csv

# 3. Filter to Comune di Ragusa only (skip the 2-line title preamble + header via NR>3)
awk -F';' 'NR>3 && $4=="\"RAGUSA\"" && $5=="\"RG\""' provincia_di_ragusa.csv

# 4. Split by role for organigramma ingestion
awk -F';' 'NR>3 && $4=="\"RAGUSA\"" && $5=="\"RG\"" && $13=="\"Sindaco\""'      provincia_di_ragusa.csv  # → sindaco (expect 1 row)
awk -F';' 'NR>3 && $4=="\"RAGUSA\"" && $5=="\"RG\"" && $13=="\"Assessore\""'    provincia_di_ragusa.csv  # → giunta (expect 7 rows; check field14 for Vicesindaco)
awk -F';' 'NR>3 && $4=="\"RAGUSA\"" && $5=="\"RG\"" && $13 ~ /Consigliere/'     provincia_di_ragusa.csv  # → consiglio (expect 24 rows; check field14 for Presidente del consiglio)
```

Gotchas for the real adapter implementation (Node/TS, not shell):
1. **Skip the 2-line preamble** before the CSV header — most CSV parsers (papaparse,
   csv-parse) will choke or misalign columns if you don't slice `lines.slice(2)` first, or
   configure `skipFirstNLines: 2`.
2. **`;` delimiter**, not `,` — set the parser's delimiter explicitly.
3. **Quoted-empty-string fields** appear as `;;` (two adjacent delimiters with no quotes at
   all, not even `""`) for empty optional columns like `incarico` when unset — verify the
   parser treats that as `null`/`""` and not an off-by-one column shift.
4. **Names have inconsistent casing/diacritics**: all-caps, apostrophes substituted for
   accented vowels (`CASSI'` for "Cassì", likely `E'` for "è", etc.). Apply a
   normalization/Title-case + diacritic-restoration step before display, or accept the
   ASCII form and pretty-print known names via a small override map (e.g. hardcode "Peppe
   Cassì" display name since DAIT will always render him as `CASSI'`/`GIUSEPPE`).
5. **`descrizione_carica` has a fourth value** beyond Sindaco/Assessore/Consigliere:
   `"Consigliere candidato sindaco"` — bucket it under Consigliere in the UI, but keep the
   raw value if you ever want to show "runner-up mayoral candidate" context.
6. **No portfolio/delega text** — do not expect "Assessore ai Lavori Pubblici" style
   strings; the field simply isn't collected by DAIT. Keep deleghe as a manually curated
   overlay (e.g. a small JSON/seed keyed by cognome+nome) merged on top of the DAIT feed,
   or scrape comune.ragusa.gov.it's organigramma page separately for that piece.
7. **File is re-published in place** (same URL, content changes) — no versioned URLs, so
   cache with `Last-Modified`/short TTL rather than assuming immutability.
8. Recommended fetch cadence: cron **weekly** (composition changes are rare outside
   by-elections/resignations/reshuffles); no rate limiting encountered in testing.
