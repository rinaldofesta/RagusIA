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
  JSON or Drizzle directly.
- **Phase 1** (this build): the whole app runs against a typed object model **seeded from the
  design's data** into Postgres. **Phase 2**: the `lib/data/adapters.ts` seam swaps each source's
  `load()` to fetch live data behind the same contract; the repository + UI never change.
- **Provenance** is the spine: every chip resolves `{ sourceId, what, observed, status }`; source
  health (`11/12 fonti ok`, ANAC `a rischio`) is real, derived from the source registry.
- **Semantic search** (Chiedi routing, Documenti) uses **pgvector** when an embedding provider is
  configured, and falls back to a deterministic keyword matcher otherwise — so the app runs with
  **zero external keys**.

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

`/` Chiedi · `/chiedi` answer (curated, provenance-cited) · `/esplora` object graph ·
`/domini` (+ `bilancio`, `appalti`, `organigramma`, `elezioni`, and `[slug]` detail) ·
`/mappa` · `/documenti` · `/fonti` · `/entita/[id]`.

## Live data ingestion (Phase 2)

Six sources now have **live adapters** that fetch real open data for the Comune di Ragusa,
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

**Still curated** (no per-comune open data): Eligendo (2023 comunali not published per-comune —
kept as the verified static result), ANAC/Albo (scrape targets), ANPR + Comune servizi (auth-gated
portals). Research notes per source live in `design/phase2-research/`. Future tiers: ISPRA, EEA,
MIM, ICCU.

> Ingestion runs as a script/cron job (never a request path); it may shell out to `curl` for
> endpoints incompatible with Node's fetch (ISTAT). Recommended cadence: daily/weekly per source.

## Deploy (later)

Provision a hosted Supabase project, `supabase link`, push migrations, set `DATABASE_URL` in the
Vercel project env, run the seed against the hosted DB, then deploy.

See `docs/superpowers/specs/` and `docs/superpowers/plans/` for the full spec + implementation plan.
