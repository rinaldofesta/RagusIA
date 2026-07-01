# IndicePA (AgID) — Organizational Anagraphic for Comune di Ragusa (c_h163)

Researched: 2026-07-01. Discovery + live verification only, no code written.

## Verdict: GREEN

IndicePA exposes a **live, public, CORS-open, auth-free CKAN datastore API** on top of its
open-data catalogue at `indicepa.gov.it/ipa-dati`. Every dataset we need (enti, AOO, unità
organizzative / uffici, PEC) has `datastore_active: true`, meaning it's queryable via
`datastore_search` with a `filters={"Codice_IPA":"c_h163"}` JSON param — no bulk download
required, no auth token, no rate-limit encountered, sub-250ms responses, license CC-BY 4.0.
This is strictly better than the legacy `PortaleServices`/`public-ws` SOAP-ish web services,
which **require a registered `AUTH_ID`** (see Gotchas) and were not needed once the CKAN API
was found. Confirmed live for `c_h163` = Comune di Ragusa across 4 datasets (Enti, AOO,
Unità Organizzative, PEC).

One caution turning this from full-green to "green with an asterisk": live UO (uffici) count
for c_h163 is **131**, not ~48 as in the seed. This is not a data-quality problem — IPA's UO
dataset includes every unit ever registered for PEC/fatturazione-elettronica purposes
(deep org-chart, including sub-units with a `Codice_uni_uo_padre` parent), which is a finer
grain than a curated "uffici" list. Needs a filtering/grouping decision at adapter time (see
Adapter notes).

## Endpoints

Base (no auth, CORS `*`): `https://indicepa.gov.it/ipa-dati/api/3/action/`

This is the standard **CKAN Action API v3**. Relevant actions:

| Action | Purpose |
|---|---|
| `package_list` | List all dataset slugs in the catalogue |
| `package_show?id=<slug>` | Dataset metadata + resource IDs (need the `resource_id` of the XLSX/CSV resource that has `datastore_active: true`) |
| `datastore_search?resource_id=<id>&filters={...}` | **The actual query endpoint** — SQL-like filter/search over a resource's rows, returns JSON records + field schema |
| `datastore_search_sql?sql=...` | Raw SQL SELECT against the datastore (available on CKAN, not separately tested here but standard) |

Dataset slugs (`package_list` result, full list) relevant to Phase 2, each backed by a
datastore-active resource:

- `enti` — anagrafica dell'ente (resource_id `d09adf99-dc10-4349-8c53-27b1e5aa97b6`)
- `aree-organizzative-omogenee` — AOO, current format (resource_id `cdaded04-f84e-4193-a720-47d6d5f422aa`)
- `aoo` — AOO, legacy pre-2021 TXT format (resource_id `2566e791-80cd-45c7-b3c9-df914b91649a`, still datastore-active)
- `unita-organizzative` — uffici/UO, current format (resource_id `b0aa1f6c-f135-4c8a-b416-396fed4e1a5d`)
- `ou` — uffici/UO, legacy pre-2021 TXT format (resource_id `4740588c-eb09-4ce8-92b0-86626508ad49`, still datastore-active)
- `pec-ente` — elenco PEC attive per ente (resource_id `ef44cd11-74e2-457c-b425-4812dc102d18`)
- `domicili-digitali-delle-unita-organizzative` — PEC/domicilio digitale per singola UO (resource_id `c306c72c-77ab-4f37-8a3a-6f7888979003`)
- `responsabili-della-transizione-al-digitale` — RTD nominativo per UO (resource_id `41553dea-0701-429e-b906-8b71e441a281`)

Use the **current-format** datasets (`enti`, `aree-organizzative-omogenee`,
`unita-organizzative`, `pec-ente`) — the legacy `amministrazioni`/`aoo`/`ou` ones are kept
only for backward compatibility per the dataset descriptions ("si consiglia l'utilizzo del
dataset [...] che contiene un maggior numero di informazioni").

Resource IDs are **stable but not guaranteed permanent** — re-resolve via `package_show`
periodically (e.g. cache for a week) rather than hardcoding forever, though in practice these
UUIDs have not changed since at least 2021 per `created` timestamps.

Legacy alternative (**not used**, noted for completeness): `https://www.indicepa.gov.it:443/public-ws/WS02_AOO.php` and siblings — POST form with `AUTH_ID` + `COD_AMM`, requires requesting an Authorization ID via `https://www.indicepa.gov.it/ipa-portale/dati-statistiche/web-service/richiedi-authorization-id`. Confirmed this path is unnecessary: `curl` to `https://indicepa.gov.it/PortaleServices/api/enti/c_h163` and the `www.` variant both **404** — that guessed REST-style path doesn't exist; the real legacy service is the AUTH_ID-gated PHP form endpoint, superseded by the CKAN API for our purposes.

## Request for c_h163 (exact working curls — all verified live)

```bash
# 1. Ente anagraphic
curl -s "https://indicepa.gov.it/ipa-dati/api/3/action/datastore_search?resource_id=d09adf99-dc10-4349-8c53-27b1e5aa97b6&filters=%7B%22Codice_IPA%22%3A%22c_h163%22%7D"

# 2. AOO (Area Organizzativa Omogenea)
curl -s "https://indicepa.gov.it/ipa-dati/api/3/action/datastore_search?resource_id=cdaded04-f84e-4193-a720-47d6d5f422aa&filters=%7B%22Codice_IPA%22%3A%22c_h163%22%7D"

# 3. Unità Organizzative / uffici (paginate: default limit=100, total=131)
curl -s "https://indicepa.gov.it/ipa-dati/api/3/action/datastore_search?resource_id=b0aa1f6c-f135-4c8a-b416-396fed4e1a5d&filters=%7B%22Codice_IPA%22%3A%22c_h163%22%7D&limit=200"

# 4. PEC attive dell'ente
curl -s "https://indicepa.gov.it/ipa-dati/api/3/action/datastore_search?resource_id=ef44cd11-74e2-457c-b425-4812dc102d18&filters=%7B%22Codice_IPA%22%3A%22c_h163%22%7D"
```

`filters` param is URL-encoded JSON: `{"Codice_IPA":"c_h163"}` → `%7B%22Codice_IPA%22%3A%22c_h163%22%7D`.
Case-sensitive field name; must match exactly (`Codice_IPA`, capital C and IPA).

Measured latency: 150–225ms per call, 3/3 requests succeeded, no throttling observed.

## Sample response (trimmed, real — captured 2026-07-01)

### 1. Ente record (`enti` dataset)

```json
{
  "Codice_IPA": "c_h163",
  "Denominazione_ente": "Comune di Ragusa",
  "Codice_fiscale_ente": "00180270886",
  "Tipologia": "Pubbliche Amministrazioni",
  "Codice_Categoria": "L6",
  "Codice_ISTAT": "30074",
  "Nome_responsabile": "Giuseppe",
  "Cognome_responsabile": "Cassi'",
  "Titolo_responsabile": "Sindaco",
  "Codice_comune_ISTAT": "088009",
  "Codice_catastale_comune": "H163",
  "CAP": "97100",
  "Indirizzo": "C.so Italia, 72",
  "Mail1": "protocollo@pec.comune.ragusa.it",
  "Tipo_Mail1": "Pec",
  "Mail2": "info@comune.ragusa.it",
  "Tipo_Mail2": "Altro",
  "Sito_istituzionale": "www.comune.ragusa.it/",
  "Url_facebook": "https://www.facebook.com/comuneRG",
  "Url_twitter": "https://twitter.com/ComuneRG",
  "Url_youtube": "https://www.youtube.com/user/comunediragusa",
  "Data_aggiornamento": "2026-04-13"
}
```
Confirms: ISTAT comune code `088009` and cadastral code `H163` both match exactly what
was given as ground truth for Ragusa. `total: 1` (unique match by Codice_IPA, as expected).

### 2. AOO record (`aree-organizzative-omogenee`)

```json
{
  "Codice_IPA": "c_h163",
  "Codice_uni_aoo": "AF122EC",
  "Denominazione_aoo": "Comune di Ragusa",
  "Data_istituzione": "2000-12-01",
  "Nome_responsabile": "Francesco",
  "Cognome_responsabile": "Lumiera",
  "Mail_responsabile": "f.lumiera@comune.ragusa.it",
  "Telefono_responsabile": "0932676259",
  "Indirizzo": "Corso Italia, 72",
  "Telefono": "0932676111",
  "Mail1": "protocollo@pec.comune.ragusa.it",
  "Tipo_Mail1": "Pec",
  "Data_aggiornamento": "2024-04-18",
  "cod_aoo": "aoorg"
}
```
`total: 1` — the Comune has a single AOO, as expected for most comuni.

### 3. Unità Organizzative / uffici (`unita-organizzative`) — first 2 of 131

```json
{
  "Codice_IPA": "c_h163",
  "Codice_uni_uo": "B67S97",
  "Codice_uni_aoo": "AF122EC",
  "Codice_uni_uo_padre": "TG8Q3R",
  "Descrizione_uo": "Programmazione, gestione e monitoraggio opere pubbliche. Programmi speciali",
  "Data_istituzione": "2013-12-23",
  "Nome_responsabile": "Ignazio",
  "Cognome_responsabile": "Alberghina",
  "Mail_responsabile": "i.alberghina@comune.ragusa.it",
  "Telefono_responsabile": "0932676509",
  "Indirizzo": "P.zza San Giovanni",
  "Telefono": "0932676509",
  "Mail1": "protocollo@pec.comune.ragusa.it",
  "Tipo_Mail1": "Pec",
  "Data_aggiornamento": "2026-02-17",
  "Url": null
},
{
  "Codice_IPA": "c_h163",
  "Codice_uni_uo": "BMFXBT",
  "Codice_uni_aoo": "AF122EC",
  "Codice_uni_uo_padre": null,
  "Descrizione_uo": "Servizi alla persona - Politiche dell'istruzione",
  "Nome_responsabile": "Salvatore",
  "Cognome_responsabile": "Guadagnino",
  "Mail_responsabile": "s.guadagnino@comune.ragusa.it",
  "Telefono_responsabile": "0932676855",
  "Indirizzo": "Via M.Spadola 56"
}
```
`total: 131`. Note the hierarchy field `Codice_uni_uo_padre` (nullable) — units can nest
under a parent UO, useful for reconstructing an org tree rather than a flat list.

### 4. PEC attive (`pec-ente`) — 3 of N for c_h163

```json
{"pec": "protocollo@pec.comune.ragusa.it", "Data_pubblicazione": "2023-03-28", "Nome_Categoria": "Comuni e loro Consorzi e Associazioni"},
{"pec": "ufficiocomunefuaragusa@pec.comune.ragusa.it", "Data_pubblicazione": "2025-03-12"},
{"pec": "riscossione.coattiva@pec.comune.ragusa.it", "Data_pubblicazione": "2024-04-02"}
```
Confirms Ragusa publishes multiple domicili digitali beyond the main protocollo PEC (a
riscossione-coattiva mailbox, a FUA/edilizia mailbox, etc.) — good candidates for
per-servizio PEC enrichment beyond the single ente-level PEC.

## Field mapping (IndicePA → RagusIA `entities`/uffici model)

| RagusIA target field | IndicePA source | Dataset |
|---|---|---|
| `denominazione` | `Denominazione_ente` | enti |
| `codice_ipa` | `Codice_IPA` | enti |
| `codice_fiscale` | `Codice_fiscale_ente` | enti |
| `codice_istat_comune` | `Codice_comune_ISTAT` (= `088009`) | enti |
| `codice_catastale` | `Codice_catastale_comune` (= `H163`) | enti |
| `indirizzo_sede` | `Indirizzo` + `CAP` | enti |
| `pec_principale` (domicilio digitale) | `Mail1` where `Tipo_Mail1="Pec"` | enti |
| `email_altro` | `Mail2..Mail5` where `Tipo_MailN="Altro"` | enti |
| `sito_istituzionale` | `Sito_istituzionale` | enti |
| `social` (facebook/twitter/youtube/linkedin) | `Url_facebook`, `Url_twitter`, `Url_youtube`, `Url_linkedin` | enti |
| `sindaco` / legale rappresentante | `Nome_responsabile` + `Cognome_responsabile` + `Titolo_responsabile` | enti |
| `aoo[]` (list) | one row per `Codice_uni_aoo` / `Denominazione_aoo` | aree-organizzative-omogenee |
| `aoo.responsabile` | `Nome_responsabile` + `Cognome_responsabile` + `Mail_responsabile` + `Telefono_responsabile` | aree-organizzative-omogenee |
| `uffici[]` (list, ~48 in seed vs 131 live) | one row per `Codice_uni_uo`, filter/group as needed | unita-organizzative |
| `ufficio.nome` | `Descrizione_uo` | unita-organizzative |
| `ufficio.responsabile` | `Nome_responsabile` + `Cognome_responsabile` + `Mail_responsabile` + `Telefono_responsabile` | unita-organizzative |
| `ufficio.parent_id` (org tree) | `Codice_uni_uo_padre` | unita-organizzative |
| `ufficio.aoo_id` (fk) | `Codice_uni_aoo` | unita-organizzative |
| `pec_list[]` (all domicili digitali, incl. per-servizio) | `pec` column, N rows | pec-ente |
| `unita_count` for the ente card | `total` field of the `datastore_search` response on `unita-organizzative` filtered by `Codice_IPA` (no need to fetch all rows — CKAN returns `total` even with `limit=0`) | unita-organizzative |

Tip: to get **just the count** cheaply, call with `limit=0`:
`...&filters=%7B%22Codice_IPA%22%3A%22c_h163%22%7D&limit=0` → returns `"total": 131` with an
empty `records` array, avoiding a 131-row payload when only the count is needed for the ente
card.

## License / auth / limits

- **License**: CC-BY 4.0 (`license_id: "CC-BY-4.0"`, confirmed in every `package_show`
  response), attribution to "Agenzia per l'Italia Digitale" (holder_identifier `agid`).
  Safe to redistribute/derive with attribution.
- **Auth**: none for the CKAN datastore API (`ipa-dati.../api/3/action/*`). Fully open, no
  API key, no registration.
- **CORS**: `Access-Control-Allow-Origin: *`, plus explicit `POST, PUT, GET, DELETE, OPTIONS`
  and `X-CKAN-API-KEY, Authorization, Content-Type` allowed headers — safe to call **directly
  from a browser client**, not just server-side.
- **Rate limits**: none advertised, none hit in 3 sequential test calls (~150–225ms each).
  Standard courtesy caching (e.g. daily refresh, since AgID states `Frequenza aggiornamento:
  giornaliera` — data updates daily) is still recommended rather than polling per-request.
- **Format**: JSON native via CKAN `datastore_search`; underlying resource files also
  downloadable as XLSX (current datasets) or tab-separated TXT (legacy `amministrazioni.txt`,
  `ou.txt`, `aoo.txt` — still live and datastore-indexed, kept for backward compatibility).
- **Data freshness marker**: each record carries its own `Data_aggiornamento` (per-record
  last-verified/updated date) — good for staleness checks in the adapter (Ragusa's ente
  record shows `2026-04-13`, its AOO shows `2024-04-18`, UO records vary `2024-04-18` to
  `2026-02-17`).

## Gotchas

- **131 vs ~48 units**: IndicePA's `unita-organizzative` is a compliance register (built for
  PEC / fatturazione elettronica addressing), not a curated "chi fa cosa" org chart. It
  includes granular sub-units, historical reorganizations, and possibly some duplicate-looking
  entries. Decide at adapter/ETL time whether to (a) take all 131 raw, (b) roll up using
  `Codice_uni_uo_padre` to just top-level offices (~likely closer to 48), or (c) cross-reference
  against the comune's own transparency-portal org chart. Recommend inspecting the full 131
  rows (paginate with `limit=200`) before deciding, rather than assuming a 1:1 mapping to the
  seed number.
- **Legacy `PortaleServices` REST guess is wrong**: `https://indicepa.gov.it/PortaleServices/api/enti/c_h163`
  returns 404 — don't use this path, it doesn't exist. The real legacy web service family is
  `public-ws/WS0x_*.php`, POST-only, and gated behind an `AUTH_ID` you must request manually
  (human-in-the-loop signup at `indicepa.gov.it/ipa-portale/dati-statistiche/web-service/richiedi-authorization-id`).
  Not needed — the CKAN API supersedes it for read-only lookups.
- **Two Ragusa ISTAT codes floating around**: the `enti` record's `Codice_ISTAT` field
  (`"30074"`) is IPA's own internal "codice ente negli elenchi ISTAT" and is **not** the
  comune ISTAT code — the actual municipal ISTAT code `088009` lives in a *different* field,
  `Codice_comune_ISTAT`. Don't confuse the two when mapping.
- **Filter field name is exact-case**: `Codice_IPA` (capital C, capital IPA) — CKAN datastore
  filters are literal-match on column name; wrong case silently returns 0 results, not an
  error.
- **`datastore_search` default `limit=100`**: the ente/AOO/PEC queries return well under that,
  but `unita-organizzative` (131 rows) needs `limit=200` (or paginate via `offset`) to get
  everything in one call.
- **Resource IDs aren't in the page HTML** — the human-facing `indicepa.gov.it/ipa-portale/consultazione/*`
  search pages are JS-rendered SPAs; WebFetch/curl against them returns near-empty shells.
  Always go through `package_show` → resource_id → `datastore_search`, not by scraping the
  portal UI.

## Adapter notes (exact working curl, ready to wire into an ETL/ingest step)

```bash
IPA_CODE="c_h163"

# Ente card fields
curl -s "https://indicepa.gov.it/ipa-dati/api/3/action/datastore_search" \
  --data-urlencode "resource_id=d09adf99-dc10-4349-8c53-27b1e5aa97b6" \
  --data-urlencode "filters={\"Codice_IPA\":\"$IPA_CODE\"}" -G

# AOO(s)
curl -s "https://indicepa.gov.it/ipa-dati/api/3/action/datastore_search" \
  --data-urlencode "resource_id=cdaded04-f84e-4193-a720-47d6d5f422aa" \
  --data-urlencode "filters={\"Codice_IPA\":\"$IPA_CODE\"}" -G

# Uffici/UO — count only (cheap, for the ente card's "N uffici" badge)
curl -s "https://indicepa.gov.it/ipa-dati/api/3/action/datastore_search" \
  --data-urlencode "resource_id=b0aa1f6c-f135-4c8a-b416-396fed4e1a5d" \
  --data-urlencode "filters={\"Codice_IPA\":\"$IPA_CODE\"}" \
  --data-urlencode "limit=0" -G

# Uffici/UO — full list (paginate if >200; 131 fits in one page)
curl -s "https://indicepa.gov.it/ipa-dati/api/3/action/datastore_search" \
  --data-urlencode "resource_id=b0aa1f6c-f135-4c8a-b416-396fed4e1a5d" \
  --data-urlencode "filters={\"Codice_IPA\":\"$IPA_CODE\"}" \
  --data-urlencode "limit=200" -G

# All PEC / domicili digitali for the ente
curl -s "https://indicepa.gov.it/ipa-dati/api/3/action/datastore_search" \
  --data-urlencode "resource_id=ef44cd11-74e2-457c-b425-4812dc102d18" \
  --data-urlencode "filters={\"Codice_IPA\":\"$IPA_CODE\"}" -G
```

Using `--data-urlencode ... -G` (rather than hand-encoding `%7B...%7D`) is the safer pattern
for a real adapter/script — avoids manual JSON-in-URL escaping bugs.

Suggested adapter shape: a single `fetchIndicePAEnte(codiceIPA: string)` function that fires
the 4 requests above in parallel (`Promise.all`), normalizes into the field-mapping table
above, and caches the result for ~24h given AgID's stated daily refresh cadence. No API key
plumbing needed — this can even run client-side given the open CORS policy, though
server-side caching is still preferable to avoid hammering AgID's infra on every page view.
