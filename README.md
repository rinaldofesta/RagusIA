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

## Phase 2 roadmap — live source adapters

Replace the Phase-1 seed adapters tier by tier, behind the same contract:

- **Clean open APIs**: ISTAT (SDMX), OpenPNRR (Openpolis), OpenCoesione, Eligendo + DAIT, IndicePA, BDAP.
- **Harder / less uniform**: ISPRA, EEA, MIM, ICCU.
- **Not open data → curated links**: ANPR + Comune servizi (auth-gated portals), Albo Pretorio (scrape).

## Deploy (later)

Provision a hosted Supabase project, `supabase link`, push migrations, set `DATABASE_URL` in the
Vercel project env, run the seed against the hosted DB, then deploy.

See `docs/superpowers/specs/` and `docs/superpowers/plans/` for the full spec + implementation plan.
