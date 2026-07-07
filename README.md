# RagusIA — Intelligenza civica

> _crevit ragusia hyblae ruinis_

A **provenance-first civic-intelligence platform** for the Comune di Ragusa. Ask a question in
natural language and get a grounded answer where **every fact carries a chip back to its public
source** — licence, format, retrieval date, observed date, row count, ingestion health. Around the
ask surface: thematic dashboards (Bilancio, Appalti, Organigramma, Elezioni…), an object graph
(Esplora), a territory map (Mappa), document search, a sources registry (Fonti), and navigable
entity cards — all unified by a global provenance drawer.

Implemented from the Claude Design composition `design/reference/Ragusia.dc.html`.

## Stack

- **Next.js 16** (App Router) · React 19 · TypeScript
- **Tailwind v4** with CSS-variable design tokens
- **Supabase** (Postgres + pgvector) via the Supabase CLI (local Docker stack)
- **Drizzle ORM** (schema + migrations + typed queries)
- **Leaflet** (map) · Phosphor icons · Spectral / Hanken Grotesk / IBM Plex Mono
- **Vitest** for unit/integration tests

## Architecture

```
public source ──adapter──▶ normalize ──▶ repository ──▶ UI (Server Components)
                                            │
                                  Supabase (Postgres + pgvector)
```

- **`lib/data/repository.ts`** is the only data boundary the UI imports. No surface touches seed
  JSON or Drizzle directly (ADR-0005).
- **Phase 1** seeded a typed object model from the design's data into Postgres. **Phase 2 (live)**:
  each source has a `LiveAdapter` at `lib/data/adapters/sources/<id>.ts` — `fetch()` retrieves and
  normalizes live data, `apply()` upserts it idempotently (interface in
  `lib/data/ingest/framework.ts`, registry in `lib/data/ingest/index.ts`). The repository + UI
  contract never changed when live data landed (ADR-0006).
- **Provenance** is the spine: every chip resolves `{ sourceId, what, observed, status }`; source
  health is derived live from the source registry + `ingest_runs` — a degraded source shows
  `a rischio`, and Bilancio/Appalti render a conditional risk banner
  (`components/features/AtRiskBanner.tsx`) only when their source is actually degraded.
- **Semantic search** (Chiedi routing, Documenti) uses **pgvector** when an embedding provider is
  configured, and falls back to a deterministic keyword matcher otherwise — so the app runs with
  **zero external keys**.
- **NL→SQL query engine** (`lib/query/`): for a free-text question the curated matcher can't
  answer — and for **analytic** questions ("quanto…", "quale ufficio ha speso di più…"), which try
  SQL first via `isAnalytic()` (`lib/search/matcher.ts`) — the app has Claude generate one
  read-only `SELECT` over flat **fact tables**, then renders the real SQL + results + provenance
  chips. The defense is layered (ADR-0001): a **single-SELECT validator**; a **FROM-clause parser
  with a hard table allowlist** (`fact_contracts`, `fact_budget`, `fact_pnrr`, `fact_coesione`,
  `entities`, `sources`) backed by quoted-identifier rejection, comment/string/dollar-quote
  stripping and blocked catalog tokens (`pg_*`, `current_*`, `version`, …); execution in a
  **read-only transaction** (4s statement timeout, 200-row cap) as the **least-privilege
  `query_reader` role** (migration `supabase/migrations/0002_query_reader_role.sql`; degrades
  gracefully to app role + allowlist where unapplied). Enabled with `QUERY_PROVIDER=gateway`
  (Vercel AI Gateway); with no provider the app falls back to the curated matcher (keyless).
  The fact tables are populated by the live adapters and a `seedFacts()` baseline.
- **Ingestion count-guard** (ADR-0002): every `pnpm ingest` records an `ingest_runs` row and
  compares the row count to the previous successful run **before writing**. A suspicious verdict
  **blocks the write** — a drop to 0 always, a >50% fall unless `--force`/`INGEST_FORCE=1` — so a
  source that silently empties can never overwrite last-good data; it just flips to `warn`
  (`⛔ COUNT-GUARD` in the log). Sources ingest in parallel, bounded by `INGEST_CONCURRENCY`
  (default 4). A scheduled **GitHub Action** (`.github/workflows/ingest.yml`) runs the ingest
  daily, with a `workflow_dispatch` source filter (it needs real curl + memory for the heavy
  ANAC/BDAP downloads, so it runs there rather than on Vercel Cron — ADR-0004).
- **Italian formatting** (currency/number/percent/date) is centralized in `lib/format.ts`, shared
  by surfaces, adapters and the seed.

## Local setup

```bash
pnpm install
supabase start            # local Postgres + pgvector (Docker)
supabase db reset         # applies migrations (pgvector + schema)
pnpm seed                 # loads the seed data into Postgres
pnpm dev                  # http://localhost:3000
```

Tests: `pnpm test` · Typecheck: `pnpm typecheck` · Build: `pnpm build`.

### Optional: semantic retrieval (pgvector)

Embeddings are **off by default**. To enable semantic routing/search, set `EMBEDDINGS_PROVIDER=gateway`
(routes through the Vercel AI Gateway via OIDC — no provider key in code) and re-run `pnpm seed`.

## Surfaces

`/` Chiedi · `/chiedi` answer (curated + NL→SQL analytic, provenance-cited) · `/esplora` object graph ·
`/domini` (+ `bilancio`, `appalti`, `organigramma`, `elezioni`, and `[slug]` detail) ·
`/mappa` · `/documenti` · `/fonti` · `/entita/[id]`.

## Live data ingestion (Phase 2)

Seven sources now have **live adapters** that fetch real open data for the Comune di Ragusa,
normalize it, and upsert it into Postgres behind the same repository contract. Run:

```bash
pnpm ingest            # refresh all live sources
pnpm ingest istat bdap # refresh specific sources
```

Each pass updates that source's **real provenance + health**: success → `ok` with fresh
retrieval date / row count; failure → the last-good data is preserved and the source flips to
`warn` ("a rischio") — the design's ingestion-health model made real. A source that is down or
rate-limited never breaks the app; it just shows `a rischio` until the next successful pass.

| Source | Feeds | Endpoint |
|---|---|---|
| **ISTAT** (SDMX) | Demografia | `esploradati.istat.it/SDMXWS` (population, foreign %, age structure; km² curated) |
| **DAIT** | Organigramma | `dait.interno.gov.it` roster CSV (deleghe stay curated) |
| **IndicePA** (CKAN) | Ente provenance | `indicepa.gov.it/ipa-dati` (c_h163) |
| **OpenPNRR** | PNRR | `openpnrr.it/api/v1` (466 projects, per-missione) |
| **OpenCoesione** | Opere/coesione | `opencoesione.gov.it/it/api` (116 interventi + status) |
| **BDAP** | Bilancio | `openbdap.rgs.mef.gov.it` SICILIA zip (spesa per missione, Titolo I/II) |
| **ANAC** (BDNCP) | Appalti | `dati.anticorruzione.it` national `cig-YYYY` monthly CSV zips, filtered by CF `00180270886` (year window via `ANAC_YEARS`, default 2024–2025) |

**Still curated** (no per-comune open data): Eligendo (2023 comunali not published per-comune —
kept as the verified static result), Albo Pretorio (scrape target), ANPR + Comune servizi
(auth-gated portals). Research notes per source live in `design/phase2-research/`. Future tiers:
ISPRA, EEA, MIM, ICCU.

> Ingestion runs as a script/cron job (never a request path); it may shell out to `curl` for
> endpoints incompatible with Node's fetch (ISTAT). Recommended cadence: daily/weekly per source.

## Deploy (later)

Provision a hosted Supabase project, `supabase link`, push migrations, set `DATABASE_URL` in the
Vercel project env, run the seed against the hosted DB, then deploy.

## Documentation map

- `docs/adr/` — architecture decision records (the current, binding decisions)
- `docs/ROADMAP.md` — staged next steps toward a solid production deployment
- `docs/superpowers/specs/` + `docs/superpowers/plans/` — **historical** design spec and phase
  plans (annotated; where they disagree with this README, the README wins)
- `design/phase2-research/` — per-source live-endpoint research notes
- `design/SURFACE_GUIDE.md` — how to build a surface
