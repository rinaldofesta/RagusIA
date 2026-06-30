# RagusIA — Design Spec

> _crevit ragusia hyblae ruinis_ — Intelligenza civica per il Comune di Ragusa.
> Source design: `Ragusia.dc.html` (Claude Design project "Ibla — Civic intelligence platform",
> `c79597f0-6b3e-4b38-9350-224928905cd4`). Date: 2026-06-30.

## 1. Vision

RagusIA is a **provenance-first civic intelligence platform** for the Comune di Ragusa. A
citizen (or administrator, or journalist) asks a question in natural language and gets a
grounded answer where **every fact carries a chip back to its public source** — license,
format, retrieval date, observed date, row count, ingestion health. It is "an archive that
thinks, not an assistant that improvises": when there is no grounded answer, it says so and
points to the relevant surfaces and sources.

Around the Ask surface sit thematic **dashboards** (Bilancio, Appalti, Organigramma, Elezioni,
and generic domain views), an **object graph** (Esplora) over the full entity/relation model,
a **territory map** (Leaflet), **document search** over Amministrazione Trasparente / Albo
Pretorio, a **sources registry** (Fonti), and navigable **entity cards** — all unified by a
single navigation shell and a global **provenance drawer**.

## 2. Goals / Non-goals

**Goals (Phase 1 — this build)**
- Faithful, refactored implementation of all **14 surfaces** from the design, matching the
  visual language (palette, typography, motion) via a real design system.
- A typed **object model** (entities, relations, domain datasets, documents, services, sources)
  that is the stable **data contract** for both the UI and the future live adapters.
- A **provenance + ingestion architecture**: adapter → normalize → repository, with per-source
  health (`ok` / `warn`) and refresh metadata, exactly as the UI surfaces it
  (e.g. `11/12 fonti ok`, ANAC `0 righe · a rischio`).
- **Supabase (Postgres + pgvector)** as the database, seeded from the design's data.
- **Semantic retrieval** (pgvector) powering the Chiedi ask routing and Documenti NL search,
  with a deterministic fallback so the app runs without external keys.
- Deployable to Vercel.

**Non-goals (Phase 1)**
- Live data from the public sources (that is Phase 2; Phase 1 seeds the DB from ported data).
- Authentication / user accounts / write operations.
- Real citizen-service transactions — services are descriptive + deep-link out (as designed).
- The empty "stub" surfaces beyond what the design already fills.

## 3. Tech stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | **Next.js (App Router, v16 line) + React + TypeScript** | URL-addressable surfaces, SSR, code-split. |
| Package manager | **pnpm** | Present (11.5). |
| Styling | **Tailwind v4 + CSS-variable design tokens** | Existing `--ink/--amber/...` palette → `@theme`. CSS Modules only for bespoke surfaces (graph/map). |
| Database | **Supabase — Postgres + pgvector** | Local stack via Supabase CLI + Docker for dev; hosted project for deploy. |
| DB access / migrations | **Drizzle ORM** | Typed schema + queries + SQL migrations; first-class pgvector. (Alt: supabase-js + generated types.) |
| Map | **Leaflet 1.9** | Esri World Imagery + CARTO tiles, custom div-icon pins (per design). |
| Icons | **@phosphor-icons** (regular/thin/duotone/fill/bold) | As used across the design. |
| Fonts | **Spectral, Spectral SC, Hanken Grotesk, IBM Plex Mono** | Google Fonts via `next/font`. |
| Embeddings | **AI SDK + configurable provider** (Vercel AI Gateway / OpenAI-compatible) | Precomputed at seed time; optional in Phase 1. |
| Tests | **Vitest** (unit) + **agent-browser / Playwright** (smoke) | Pure logic unit-tested; one real browser run before "done". |

## 4. Architecture

### 4.1 Routing (surface → route)

The design's `surface` state machine becomes real routes:

| Surface | Route |
|---|---|
| Chiedi — home | `/` |
| Chiedi — answer | `/chiedi?q=…` (or `/chiedi/[qaId]`) |
| Esplora (object graph) | `/esplora` |
| Domini — overview | `/domini` |
| Bilancio | `/domini/bilancio` |
| Appalti | `/domini/appalti` |
| Organigramma | `/domini/organigramma` |
| Elezioni | `/domini/elezioni` |
| Generic domain detail | `/domini/[slug]` (opere, pnrr, demografia, ambiente) |
| Mappa | `/mappa` |
| Documenti | `/documenti?q=…&sez=…` |
| Fonti | `/fonti` |
| Entità | `/entita/[id]` |

- **Provenance drawer** is a global client overlay driven by a search param
  (`?fonte=anac&val=<attested fact>`), so a cited fact is a **shareable link** and the drawer
  works over any surface (server-rendered or not).
- **Shell**: a persistent sidebar (logo + ente card + nav + data-status footer) + a main slot.
  Esplora and Mappa are full-bleed (dark "inchiostro" / parchment) and override the main padding.
- Interactive pieces stay client components: the Ask thinking→answer sequence, `ObjectGraph`
  (pan/zoom/hover/filter), `TerritoryMap` (Leaflet), `DocSearch`, the drawer.

### 4.2 Data layer (adapter → normalize → repository)

```
PublicSource ──adapter.load()──▶ raw records + provenance
                                   │
                            normalize()  ──▶ ObjectModel records (entities/relations/datasets)
                                   │
                              repository  ◀── reads ── UI (Server Components / route handlers)
                                   │
                              Supabase (Postgres + pgvector)
```

- **Adapter interface** (one per source): `load(): Promise<{ records: RawRecord[]; provenance: Provenance }>`.
  `Provenance = { sourceId, license, format, retrieved, observed, rows, hash?, status: 'ok'|'warn', refresh }`.
- **Phase 1**: each adapter's `load()` returns a committed **seed JSON snapshot** (ported
  verbatim from the design's data). A **seed script** normalizes these into the object model and
  writes them to Supabase (idempotent upsert). The app runs fully offline against the DB.
- **Phase 2**: the same adapters fetch live + cache; `normalize()`, the repository, the schema,
  and the UI are unchanged. Source health flips to real ingestion status.
- **Repository**: the only thing the UI talks to. Methods like `getEntity(id)`,
  `getDomain(slug)`, `listSources()`, `searchDocuments(q)`, `routeQuestion(q)`,
  `getGraph()`. Backed by Drizzle queries against Supabase.

### 4.3 Database schema (Supabase / Postgres)

Tables (snake_case), public read (RLS read-only for Phase 1; no anon writes):

- `sources` — id, short, full, icon, what, url, license, format, retrieved, observed, rows,
  hash, status, refresh.
- `entities` — id, type_label, name, icon; `entity_sources` (entity_id → source_id).
- `relations` — graph clusters + cross-links (from_id, to_id, label, dashed, kind).
- `domains` — slug, icon, title, sub, kind (`full` | `skeleton` | `real`).
- `domain_kpis`, `domain_bars`, `domain_tables` — dataset rows keyed by domain slug (covers
  Bilancio missioni/capitoli/trend, Appalti operatori/uffici/contratti, generic detail charts).
- `governo` — sindaco, assessori, settori (Organigramma); `elezione` — candidati, liste,
  consiglieri (Elezioni).
- `documents` — tipo, n, title, date, uff, sez, tags, hash, source_id.
- `services` — id, nome, icona, ufficio, sintesi, come_fare[], cosa_serve[], dove, quando,
  costo, tempi, online{label,url}, source_id.
- `qa` — id, question, body (curated prose blocks), entity_ids[], source_ids[], sql.
- `embeddings` — owner_type (`qa`|`service`|`document`|`entity`), owner_id,
  `embedding vector(N)`, content text. **pgvector** ivfflat/hnsw index for ANN search.

Every value that the UI renders with a chip resolves a **provenance reference**
`{ sourceId, what, observed, status }`. This is the contract Phase-2 adapters must satisfy.

### 4.4 Ask flow & semantic retrieval

- **Curated answers stay**: the five bespoke QA answers (giunta, bilancio, appalti, pnrr,
  demografia) and the six service answers are hand-authored prose with specific inline
  provenance chips and an "evidence" block (entities cited + sources used) + a "show the query"
  SQL reveal. These render exactly as designed.
- **Routing**: a free-text query is routed to the best `qa`/`service` via **pgvector ANN**
  over `embeddings` when an embedding provider is configured; otherwise the deterministic
  keyword matcher (ported `matchQA`) is the fallback. `nomatch` → the honest "no precomputed
  answer" state.
- **Documenti**: NL search blends pgvector similarity with the ported token matcher + filters
  (sezione / albo categoria); Postgres full-text as offline fallback.
- **Staged reveal**: `idle → thinking (~760ms shimmer) → answer → evidence` preserved as client
  state/animation.

### 4.5 Source feasibility tiers (Phase 2 expectations)

- **Clean open APIs**: ISTAT (SDMX), OpenPNRR (Openpolis), OpenCoesione, Eligendo + DAIT
  (Min. Interno open data), IndicePA (AgID), BDAP (MEF/RGS).
- **Harder / less uniform**: ISPRA, EEA, MIM (edilizia scolastica), ICCU (biblioteche).
- **Not open data → stay curated links**: ANPR + Comune "servizi" (auth-gated citizen portals),
  Albo Pretorio (scrape, not an API). The design already treats these as service/portal links.

## 5. Design system

- **Tokens** → Tailwind v4 `@theme` + `:root` CSS vars: full palette (`ink/ink-2/ink-3`,
  `paper`, `card/card-2`, `sand/sand-2`, `line/line-2`, `amber/amber-d/amber-tint`, `teal`,
  `terra`, `olive`, `stone`, `sky`, `plum`), the four font families, radii, the keyframes
  (`ibFadeUp/ibBlink/ibShimmer/ibSlideL/ibFade/ibPulse`), scrollbar + Leaflet overrides, the
  `chipMode` (piena/discreta) provenance-prominence variant.
- **Primitives**: `SourceChip` (dot variants: ok/warn/est; piena/discreta), `KpiCard`,
  `BarRow` (labelled progress bar), `SectionCard`, `Sidebar` + `NavItem` + `DataStatus`,
  `ProvenanceDrawer`, `EntityRef`, `SuggestionChip`, `AnswerProse` (+ inline `Cite`), `Breadcrumb`.
- **Feature components**: `ObjectGraph` (computed radial layout, pan/zoom/wheel, hover
  highlight + adjacency, type filter, labels toggle), `TerritoryMap` (Leaflet: layer toggles,
  satellite/stradale vista, custom pins, selected-marker card), `DocSearch`.
- **Assets**: import `ragusa-stemma.png` (coat of arms) from the design project into `public/`.

## 6. Surfaces (what each renders)

1. **Chiedi — home**: date/ente line, hero, ask form, suggested civic + service chips, stats
   footer (≈7.400 entità / ≈18.200 relazioni / 12 fonti).
2. **Chiedi — answer**: question header, thinking shimmer, one of the curated answers (or
   service card: come fare / cosa serve / dove-quando-costo-tempi + online CTA), evidence block,
   SQL reveal.
3. **Domini — overview**: 8 domain cards with KPI value + source chip; "completa" badge for
   Bilancio/Appalti.
4. **Bilancio**: 4 KPIs, spesa-per-missione bars (entity-linked), spend trend SVG sparkline,
   corrente/capitale split, top capitoli table.
5. **Appalti**: risk banner (ANAC 0 righe), 4 KPIs, top operatori + per-ufficio bars,
   recent contracts table (operator → entity card, per-row provenance).
6. **Organigramma**: sindaco card, giunta grid (9), consiglio (presidente + maggioranza/
   opposizione), 11 settori; links to Elezioni.
7. **Elezioni**: 4 KPIs, candidati bars, liste bars, consiglieri-per-lista; Eligendo chips.
8. **Generic domain detail** (`opere/pnrr/demografia/ambiente`): KPIs + a bar chart + sources +
   optional entity CTA + "ossatura" note.
9. **Esplora**: dark object graph — type sidebar (17 types, filter), pan/zoom canvas, nodes +
   edges + relation labels, hover adjacency highlight; node click → entity / service / source.
10. **Mappa**: Leaflet territory map, layer panel (6 layers), vista toggle, georeferenced
    markers, selected-marker card (→ entity or source).
11. **Documenti**: NL search + suggested queries, Amministrazione Trasparente + Albo Pretorio
    filters, result cards (atto link, source chip, hash line).
12. **Fonti**: registry — totals (12 / ok / warn), per-source rows with health, license, format,
    rows, refresh; row → provenance drawer.
13. **Entità**: header + "composta da" source chips; specialized bodies for Settore/Ufficio,
    Operatore economico, Opera pubblica, and a generic body; cross-links to other entities/graph/map.
14. **Provenance drawer** (global): attested fact, source identity + health, license/format/
    retrieved/observed/rows, optional SHA-256 hash, link out, "vedi nel registro Fonti".

## 7. Project structure (proposed)

```
app/                       # App Router surfaces + layout (sidebar shell)
  (shell)/...              # routes sharing the sidebar
  esplora/ mappa/          # full-bleed routes
components/
  primitives/  features/   # design-system + ObjectGraph/TerritoryMap/DocSearch
lib/
  model/                   # TS object-model types (the contract)
  data/adapters/           # one adapter per source (Phase 1: seed JSON)
  data/seed/               # committed seed JSON (ported from the design)
  data/repository.ts       # the only thing the UI queries
  db/ (drizzle schema, migrations, client)
  search/ (embeddings + matcher)
supabase/                  # CLI config + SQL migrations
public/ragusa-stemma.png
styles/ (tokens.css, globals)
docs/superpowers/specs/    # this spec + plan
```

## 8. Testing & verification

- **Unit (Vitest)**: provenance resolution; ported `matchQA` routing; doc-search token matcher;
  graph layout math (`_buildGraph`); election/trend bar math; repository queries against a
  local Supabase.
- **Smoke**: every route renders without error; the drawer opens/closes; map initializes.
- **Browser run**: launch the app and verify the key flows (ask → answer → drawer; domini →
  bilancio; esplora pan/zoom/filter; mappa layers; documenti search; entity navigation) before
  declaring Phase 1 done.

## 9. Phasing

- **Phase 1 (this build)**: scaffold; design system; Supabase schema + seed; object model +
  adapter/repository seeded from JSON; all 14 surfaces; Leaflet map; pgvector wired (semantic
  when key present, fallback otherwise); deployable. _Verified by running the app._
- **Phase 2 (next cycle)**: real source adapters behind the same contract, tier by tier
  (clean APIs first), flipping seed data to live ingestion with real health.

## 10. Resolved decisions

1. **ORM**: **Drizzle ORM** — typed schema, versioned SQL migrations, pgvector support.
2. **Embeddings (Phase 1)**: **wired but optional**. pgvector schema + retrieval path are built;
   embeddings are computed at seed time only if an embedding provider key is configured. With no
   key, the app uses the deterministic keyword matcher + Postgres full-text. The app runs with
   **zero external keys**.
3. **Supabase**: **local Docker stack** (`supabase start`) for Phase 1 dev + seed; provision the
   hosted project later, at deploy time.
4. **Embedding dimension**: `vector(1536)` (sized for `text-embedding-3-small`), ready regardless
   of whether embeddings are populated in Phase 1.
```
