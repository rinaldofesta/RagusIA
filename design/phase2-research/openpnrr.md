# OpenPNRR (Fondazione Openpolis) — PNRR projects for Comune di Ragusa

Research date: 2026-07-01. All requests below were actually executed with `curl` against the live API.

## Verdict: GREEN

Public, unauthenticated, CORS-open JSON REST API (Django REST Framework). No API key. Directly filterable by comune via ISTAT code → internal `territorio` id, and by missione via `missione__codice_identificativo`. Verified live: **466 progetti** localized in Comune di Ragusa (territorio id 224, ISTAT 088009), broken down by missione, with per-project financing fields available for aggregation. Close to (slightly above) the ~463 figure quoted in the brief — plausible drift from ongoing data updates (dataset last updated per FAQ: 31 Mar 2025 mission dataset / progetti "as of Oct 2025 in one page, continuously updated" per search snippet; live query on 2026-07-01 shows `data_estrazione_regis` values up to 2026-02-26, i.e. actively refreshed).

One important caveat found and verified (see Gotchas): a small number of projects (52/466, 11.2%) are **multi-comune** (linked to >1 `territorio`), including one €2.27B national Ministero della Giustizia digitalization project linked to 140 comuni (courts) with no per-comune financing split. This project alone accounts for ~92% of the raw M1 financing sum if included naively. Financing aggregation needs an explicit policy decision (see Field mapping).

## Endpoints

Base: `https://openpnrr.it/api/v1/` (no separate `api.openpnrr.it` subdomain — API is path-based on the main domain).

Root discovery (`GET /api/v1/`) returns the resource map:
```json
{"missioni":"https://openpnrr.it/api/v1/missioni","componenti":"https://openpnrr.it/api/v1/componenti","misure":"https://openpnrr.it/api/v1/misure","scadenze":"https://openpnrr.it/api/v1/scadenze","organizzazioni":"https://openpnrr.it/api/v1/organizzazioni","territori":"https://openpnrr.it/api/v1/territori","temi":"https://openpnrr.it/api/v1/temi","priorita":"https://openpnrr.it/api/v1/priorita","progetti":"https://openpnrr.it/api/v1/progetti"}
```

Relevant endpoints for our use case:
- `GET /api/v1/territori?istat_id=<comune_istat>` — resolve ISTAT comune code → internal territorio id
- `GET /api/v1/progetti?territori=<id>&missione__codice_identificativo=<mN>&page_size=1000` — list/count projects for a comune, optionally filtered by missione
- `GET /api/v1/missioni` — the 6 (+1 REPowerEU = 7) missioni with codice, descrizione, and PNRR-wide totals (not comune-scoped)
- `GET /api/v1/componenti/{id}` — componente detail, includes `missione` FK url (needed to join misura → componente → missione if not using the direct filter)
- `GET /api/v1/misure/{id}` — misura detail, includes `componente` FK url
- `GET /api/v1/progetti/{id}` — full project detail incl. `pagamenti` (payment history) and `territori` list
- `GET /api/v1/schema/` (with `Accept: application/json`) — full Swagger 2.0 schema, lists every filter param per endpoint (ground truth used below)
- HTML browsable API / Swagger explorer at `/api/v1/` and `/api/v1/schema/` (per opendata page; DRF default browsable UI)

Full CSV downloads (missioni, componenti, misure, scadenze, organizzazioni, territori, temi, priorita, bandi di gara, progetti, progetti-localizzazioni, pagamenti) are also listed at `https://openpnrr.it/opendata/` for anyone who prefers dataset ingestion over API polling — not verified by curl (page not fetched as raw file list, only via WebFetch summary), but is a viable fallback/cross-check path.

## Request params for Ragusa — verified working calls

**Step 1 — resolve Ragusa's territorio id from ISTAT code 088009:**
```bash
curl -s "https://openpnrr.it/api/v1/territori?istat_id=088009"
```
Result (real, live):
```json
{
  "count": 1, "next": null, "previous": null,
  "results": [
    {
      "id": 224,
      "slug": "ragusa-2",
      "url": "https://openpnrr.it/api/v1/territori/224",
      "parent": "https://openpnrr.it/api/v1/territori/105",
      "denominazione": "Ragusa",
      "istat_id": "088009",
      "opdm_id": 7553,
      "tipologia": "C",
      "identifier": "H163"
    }
  ]
}
```
Confirms `identifier` = `H163` (cadastral code) matches, `tipologia: "C"` = comune, `parent` = territorio 105 (Provincia di Ragusa presumably). **Ragusa's stable `territorio` id is 224** — use this, not the ISTAT/cadastral code, for the `progetti` filter.

**Step 2 — total project count for Ragusa:**
```bash
curl -s "https://openpnrr.it/api/v1/progetti?territori=224&page_size=1"
```
Result: `"count": 466`

**Step 3 — per-missione counts (verified filter, matches client-side join exactly):**
```bash
for m in m1 m2 m3 m4 m5 m6 m7; do
  curl -s "https://openpnrr.it/api/v1/progetti?territori=224&missione__codice_identificativo=$m&page_size=1"
done
```
Results (live, 2026-07-01):

| Missione | Codice | Count |
|---|---|---|
| Digitalizzazione, innovazione, competitività, cultura e turismo | M1 | 89 |
| Rivoluzione verde e transizione ecologica | M2 | 166 |
| Infrastrutture per una mobilità sostenibile | M3 | 0 |
| Istruzione e ricerca | M4 | 92 |
| Inclusione e coesione | M5 | 99 |
| Salute | M6 | 17 |
| REPowerEU | M7 | 3 |
| **Total** | | **466** |

M3 = 0 is real, not a bug: comune-level mobility works for Ragusa appear to be attributed at provincia/regione territorio level in this dataset, not tagged to the comune territorio. Confirmed 89+166+0+92+99+17+3 = 466 = total count, and cross-verified by an independent client-side join (fetch all 466 projects with `page_size=1000`, resolve each `misura` → `componente` → `missione` via the componenti/misure lookup tables) — identical numbers.

**Step 4 — full project list in one page (for financing aggregation):**
```bash
curl -s "https://openpnrr.it/api/v1/progetti?territori=224&page_size=1000"
```
`page_size=1000` returns all 466 results with `"next": null` in a single request — no pagination loop needed at Ragusa's scale. Response size ≈ 1.17 MB JSON.

## Sample response (trimmed, real)

One project record from `progetti?territori=224&page_size=1`:
```json
{
  "url": "https://openpnrr.it/api/v1/progetti/254391",
  "titolo": "14.03 - LAVORI DI REALIZZAZIONE POSTI DI TERAPIA INTENSIVA E SUB INTENSIVA- EMERGENZA COVID 19 - TI-SIC_RAGUSA_1041*VIA C.DA CISTERNAZZI*...",
  "cup": "G27H22000040001",
  "finanziamento_pnrr": "6406185.03",
  "finanziamento_totale": "6406185.03",
  "finanziamento_totale_pubblico": "6406185.03",
  "stato_avanzamento": "IC",
  "is_validato": false,
  "source": "ITDOM",
  "misura": "https://openpnrr.it/api/v1/misure/318",
  "soggetto_attuatore": "https://openpnrr.it/api/v1/organizzazioni/74196",
  "territori": ["https://openpnrr.it/api/v1/territori/618"]
}
```
Note `territori` here shows id 618 (not 224) for *this specific* project — the `territori=224` filter matched it because OpenPNRR's territorio hierarchy / project-localization join resolves through parent-child or multiple entries; in the full dataset dump some projects do list `224` directly and others reference sub-territorio ids that roll up to it. **Practical implication:** trust the API's own `territori=224` filter (server-side, verified against 3 independent checks) rather than re-deriving membership from the `territori` array client-side.

`missioni` list sample (global, not comune-scoped — used only to get codice → id/descrizione mapping):
```json
{
  "id": 6, "codice": "M6", "descr": "Salute",
  "importo_totale_pnrr": 15625541083.51, "importo_totale": 17062951083.6
}
```

`componenti/{id}` sample (join table between misura and missione):
```json
{
  "id": 16, "missione": "https://openpnrr.it/api/v1/missioni/6",
  "codice": "M6C2", "descr": "Innovazione, ricerca e digitalizzazione del servizio sanitario nazionale"
}
```

## Field mapping → RagusIA fields

| RagusIA field | Source | Formula / notes |
|---|---|---|
| Total PNRR projects at Ragusa | `GET /progetti?territori=224&page_size=1` → `count` | Direct. **466** (live 2026-07-01). |
| Count per missione (M1–M6) | `GET /progetti?territori=224&missione__codice_identificativo={m1..m6}&page_size=1` → `count`, one call per missione | Direct, verified. M1=89, M2=166, M3=0, M4=92, M5=99, M6=17 (M7 REPowerEU=3, extra bucket not in the brief's M1–M6 list — decide whether to fold into "altro" or drop). |
| Total financing | Sum of `finanziamento_totale` (or `finanziamento_pnrr` for PNRR-only funds) across all 466 projects | **Needs a policy decision** — see Gotchas. Raw naive sum = €2,460,973,057.69 (`finanziamento_totale`) / €2,408,769,524.92 (`finanziamento_pnrr`-only). Excluding the single 140-comune outlier project (CUP J89J21009760006, Ministero Giustizia, €2.268B): remaining sum ≈ €192.9M — far more representative of "money actually landing in Ragusa." Recommend either (a) exclude projects with `len(territori) > 1` from the financing sum (keep them in the count), or (b) divide their `finanziamento_totale` by number of territori as an estimated apportionment, or (c) label the headline number explicitly as "financing including nationally-shared projects" if using the raw sum. |
| Missione display name | `GET /missioni` → `codice` + `descr` | Static, cache indefinitely (rarely changes): M1 "Digitalizzazione, innovazione, competitività, cultura e turismo", M2 "Rivoluzione verde e transizione ecologica", M3 "Infrastrutture per una mobilità sostenibile", M4 "Istruzione e ricerca", M5 "Inclusione e coesione", M6 "Salute". |
| Per-missione financing (if needed) | Sum `finanziamento_totale` grouped by `missione__codice_identificativo` filter, same caveat as total financing above | M1 raw=€2,312,321,211.55 (dominated by the outlier; excl. outlier ≈ €44.3M), M2=€53,781,690.17, M3=€0, M4=€24,154,649.73, M5=€48,176,896.77, M6=€22,224,409.47. |
| Project detail drill-down (optional, Phase 3+) | `GET /progetti/{id}` | Includes `pagamenti` array (payment tranches over time), `cup`, `soggetto_attuatore` (implementing body), `stato_avanzamento` (IC=in corso, CO=completato, DA=da avviare — counts for Ragusa: IC=305, CO=160, DA=1). |

## License / auth / limits

- **License: ODbL 1.0** (Open Data Commons Open Database License), NOT CC-BY as assumed in the brief. Quoted from the opendata page: "Tutti i dati esposti sono rilasciati con licenza ODbL 1.0" (https://it.okfn.org/odbl-riassunto/). ODbL requires attribution + share-alike for derivative databases — check compatibility with RagusIA's overall data licensing before shipping; likely fine for attribution + keeping any republished derivative dataset open, but flag to the team since it's share-alike (copyleft), stricter than CC-BY.
- **Auth: none required for GET requests observed.** The Swagger schema declares `"securityDefinitions": {"Basic": {"type": "basic"}}, "security": [{"Basic": []}]` — meaning Basic Auth is *supported* by the DRF backend (e.g. for write/admin operations), but all read/list endpoints used above returned `200 OK` with zero credentials.
- **CORS: fully open.** Verified header: `access-control-allow-origin: *` on `/api/v1/progetti`. Safe to call directly from a browser/client-side fetch, no proxy needed.
- **Rate limits:** none advertised, none observed. 3 rapid sequential requests all returned 200 in ~0.4–0.6s each. No `X-RateLimit-*` headers present. Be a good citizen (cache responses, don't poll aggressively) but no documented throttle to design around.
- **Response format:** JSON only tested (`Accept: application/json`); DRF also renders `text/html` (browsable API) per the root `Allow`/`renders` metadata. Pagination is standard DRF `count`/`next`/`previous`/`results`, default page size is small but `page_size` query param can be pushed at least to 1000 (tested and worked for both `progetti` at territori=224 and `misure` full list of 412).
- **Update cadence:** FAQ states "constant updates based on daily monitoring of official sources." Individual projects carry `data_estrazione_regis` (extraction date from the national REGIS system) — observed values up to `2026-02-26` in live data, so it is being refreshed close to real-time, not a stale yearly snapshot.
- **No dedicated API subdomain** — everything is on `openpnrr.it/api/v1/`, contrary to the brief's guess of `api.openpnrr.it`.

## Gotchas

1. **Filter naming trap:** the intuitive Django-style nested filter `misura__componente__missione=<id>` is *silently accepted but ignored* by the API — it returns HTTP 200 with the full unfiltered count instead of erroring. Always cross-check filter params against the live Swagger schema (`GET /api/v1/schema/` with `Accept: application/json`) rather than guessing DRF-style lookups. The correct, verified param is **`missione__codice_identificativo`** (lowercase `m1`..`m7`, case-insensitive per its description).
2. **Multi-comune projects distort financing totals.** 52/466 (11.2%) of Ragusa's projects are linked to more than one `territorio` (shared infrastructure, national programs, court digitalization, etc.). One single project (Ministero della Giustizia court digitalization, CUP J89J21009760006) is linked to 140 comuni nationwide and carries the *entire* national financing figure (€2.268B) with no per-comune apportionment field. Naively summing `finanziamento_totale` across all 466 projects overstates "money for Ragusa" by roughly 12x. Recommend excluding multi-territorio projects from the financing KPI (or clearly labeling/footnoting it), while still counting them in the project-count KPI since they do have a real local footprint (e.g., the local Tribunale).
3. **Territori array on individual project records can look inconsistent** with the filter that matched them (e.g., a project matched by `territori=224` may show a different, more granular territorio id like 618 in its own `territori` field) — this is due to territorio hierarchy (comune ↔ provincia ↔ regione parent/child chains and/or historical comune mergers). Trust the server-side `territori=<id>` filter result set over re-deriving membership from the returned `territori` field client-side.
4. **M7 REPowerEU** is a 7th "missione" bucket (3 projects for Ragusa) not mentioned in the brief's M1–M6 list — decide whether to surface it separately, merge into "altro," or drop from the UI.
5. **`finanziamento_totale` vs `finanziamento_pnrr`**: the record has ~15 separate financing source fields (stato, UE non-PNRR, regione, provincia, comune, altro pubblico, privato, PNC, altri fondi, etc.). `finanziamento_totale` is the all-sources sum; `finanziamento_pnrr` isolates just the PNRR-funded portion. Confirm with the team which one the "total financing" KPI should represent — for Ragusa the two are close (€2.46B vs €2.41B raw) but diverge more once the outlier is excluded, since the outlier is 100% `finanziamento_pnrr`.
6. Count of 466 vs. brief's quoted ~463 is a 3-project (0.6%) drift — well within expected variance from OpenPNRR's stated daily update cadence; not a bug, just re-verify count at implementation time since it will keep moving.

## Adapter notes — exact working curl commands

```bash
# 1. Resolve comune → territorio id (do this once, cache the id=224 mapping for Ragusa)
curl -s "https://openpnrr.it/api/v1/territori?istat_id=088009"

# 2. Total project count
curl -s "https://openpnrr.it/api/v1/progetti?territori=224&page_size=1"
# → parse .count

# 3. Per-missione counts (6 calls, or 1 call with page_size=1000 + client-side groupby — see #4)
for m in m1 m2 m3 m4 m5 m6; do
  curl -s "https://openpnrr.it/api/v1/progetti?territori=224&missione__codice_identificativo=${m}&page_size=1"
  # → parse .count per missione
done

# 4. Full project dump for financing aggregation (single request, no pagination needed at this scale)
curl -s "https://openpnrr.it/api/v1/progetti?territori=224&page_size=1000" > ragusa_progetti.json
# then in application code: sum finanziamento_totale (or finanziamento_pnrr) per project,
# EXCLUDING or flagging projects where len(territori) > 1 (see Gotcha #2),
# and group by missione via missione__codice_identificativo semantics
# (or precompute via componenti/misure lookup — GET /componenti?page_size=100 and
# GET /misure?page_size=1000 — joining progetto.misura → misura.componente → componente.missione).

# 5. Static missione display names (cache indefinitely)
curl -s "https://openpnrr.it/api/v1/missioni"
```

Suggested adapter design for RagusIA `pnrr` domain:
- On build/ISR revalidate (not per-request): call #2 and the 6 calls in #3 (or #4 + local groupby, cheaper as 1 request instead of 7), cache the result (e.g. revalidate daily given OpenPNRR's own daily update cadence).
- Compute "total financing" as the sum of `finanziamento_totale` over projects where `territori` has exactly 1 entry (single-comune, unambiguously Ragusa-only), and separately surface a footnote/secondary stat for "projects with shared/national funding" (the 52 multi-comune ones) rather than blending them into one headline euro figure.
- No API key/env var needed; safe to call directly (CORS open) but prefer server-side fetch + cache to respect the API and avoid exposing call patterns, and to control the financing-aggregation logic centrally.
