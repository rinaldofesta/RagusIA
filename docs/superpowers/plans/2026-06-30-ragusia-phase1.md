# RagusIA Phase 1 — Implementation Plan

> **Status (2026-07-07): executed, historical.** Env vars changed since: `OPENAI_API_KEY` was
> replaced by the Vercel AI Gateway configuration (`EMBEDDINGS_PROVIDER=gateway`; see
> `.env.example` and ADR-0003). Current architecture: `README.md`.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build RagusIA — a provenance-first civic-intelligence app for the Comune di Ragusa — as a real Next.js + TypeScript + Tailwind v4 + Supabase application, faithfully reproducing all 14 surfaces of `Ragusia.dc.html` against a typed object model seeded into Postgres, with the ingestion/provenance architecture and pgvector retrieval wired (optional) behind a deterministic fallback.

**Architecture:** App Router routes map the design's `surface` state machine; a global provenance drawer is driven by a `?fonte=` search param. Data flows adapter → normalize → repository; the repository (Drizzle over Supabase Postgres) is the only thing the UI queries. Phase 1 seeds the DB from JSON ported verbatim from the design; Phase 2 swaps adapters to live sources behind the same contract.

**Tech Stack:** Next.js (App Router, v16 line) · React · TypeScript · Tailwind v4 · Supabase (Postgres + pgvector) · Drizzle ORM · Leaflet 1.9 · Phosphor Icons · next/font (Spectral / Spectral SC / Hanken Grotesk / IBM Plex Mono) · Vitest · pnpm.

## Global Constraints

- **Package manager:** pnpm (lockfile committed).
- **Node:** ≥ 22 (dev env is Node 26).
- **Language/copy:** All UI copy is **Italian**, verbatim from `Ragusia.dc.html`. Preserve accents/diacritics exactly (e.g. `città`, `attività`, `«Peppe»`). Latin motto: `crevit ragusia hyblae ruinis`.
- **Design source of truth:** `design/reference/Ragusia.dc.html` (1775-line clean extract). All surface markup and all seed data are ported from it. Line ranges cited in tasks refer to this file.
- **Visual fidelity:** match the mockup exactly. Convert inline styles to Tailwind tokens using the mapping in Task 2; drop to CSS Modules only for `ObjectGraph` and `TerritoryMap`.
- **Palette tokens (verbatim hex):** `--ink:#1C1A17` · `--ink-2:#5C554B` · `--ink-3:#8A8175` · `--paper:#F4EFE6` · `--card:#FBF8F1` · `--card-2:#FDFBF6` · `--sand:#EAE3D5` · `--sand-2:#E3DACA` · `--line:rgba(28,26,23,0.10)` · `--line-2:rgba(28,26,23,0.17)` · `--amber:#C2972A` · `--amber-d:#9B7517` · `--amber-tint:#EFE1BC` · `--teal:#2A66A8` · `--terra:#C0623D` · `--olive:#7E7A3F` · `--stone:#9B9385` · `--sky:#5B8CA3` · `--plum:#7A5160`.
- **Repository is the only UI data boundary.** No surface imports seed JSON or Drizzle directly; everything goes through `lib/data/repository.ts`.
- **Provenance contract:** every chip resolves `{ sourceId, what?, observed?, status? }`. Source `status` is `'ok' | 'warn'`.
- **Embeddings optional:** no external API key may be required to run, seed, build, or test. Semantic path activates only if `EMBEDDINGS_PROVIDER` env is set; otherwise deterministic matcher + Postgres full-text.
- **Commits:** conventional commits, one per task minimum. Branch off `main`; never commit secrets (`.env*` gitignored, `.env.example` committed).

## File Structure

```
design/reference/            Ragusia.dc.html, support.js, ragusa-stemma.png  (source of truth)
app/
  layout.tsx                 root: fonts, <html>, globals
  (shell)/layout.tsx         sidebar shell (Sidebar + main slot + ProvenanceDrawer mount)
  (shell)/page.tsx           Chiedi home   → '/'
  (shell)/chiedi/page.tsx    Chiedi answer → '/chiedi'
  (shell)/domini/page.tsx    Domini overview
  (shell)/domini/bilancio/page.tsx
  (shell)/domini/appalti/page.tsx
  (shell)/domini/organigramma/page.tsx
  (shell)/domini/elezioni/page.tsx
  (shell)/domini/[slug]/page.tsx     opere|pnrr|demografia|ambiente
  (shell)/documenti/page.tsx
  (shell)/fonti/page.tsx
  (shell)/entita/[id]/page.tsx
  esplora/page.tsx           full-bleed (own layout, no shell padding)
  mappa/page.tsx             full-bleed
components/
  primitives/                SourceChip, KpiCard, BarRow, SectionCard, Sidebar, NavItem,
                             DataStatus, ProvenanceDrawer, EntityRef, SuggestionChip,
                             AnswerProse, Cite, Breadcrumb, StatTriple
  features/                  AskBox, AnswerView, ObjectGraph(+.module.css),
                             TerritoryMap(+.module.css), DocSearch
lib/
  model/types.ts             the object-model TS contract
  data/seed/*.ts             seed data ported from the design (one module per dataset)
  data/adapters/*.ts         one adapter per source (Phase 1: returns seed)
  data/normalize.ts          seed → object-model records
  data/repository.ts         the only UI data boundary (Drizzle queries)
  db/schema.ts               Drizzle schema (tables + pgvector)
  db/client.ts               Drizzle client (postgres-js)
  db/seed.ts                 idempotent seed runner (normalize → upsert)
  search/matcher.ts          ported deterministic matchQA + doc token matcher
  search/embeddings.ts       optional provider wrapper (no-op without key)
  graph/layout.ts            ported _buildGraph radial layout math
styles/
  tokens.css                 @theme + :root vars + keyframes + scrollbar/leaflet overrides
supabase/                    CLI config + SQL migrations (drizzle-kit output)
test/                        Vitest unit tests
.env.example  drizzle.config.ts  next.config.ts  tailwind via @import in globals
```

---

## Milestone 0 — Reference assets in repo

### Task 0: Preserve the design as in-repo source of truth

**Files:**
- Create: `design/reference/Ragusia.dc.html`, `design/reference/support.js`, `design/reference/ragusa-stemma.png`
- Create: `.gitignore`, `README.md` (stub)

**Interfaces:**
- Produces: `design/reference/Ragusia.dc.html` — the 1775-line clean extract every later task cites by line number.

- [ ] **Step 1: Init git + gitignore**

```bash
cd /Users/rinaldofesta/Projects/Personal/ragusia
git init -b main
printf "node_modules/\n.next/\n.env\n.env*.local\n.DS_Store\nsupabase/.branches/\nsupabase/.temp/\ndrizzle/.cache/\n" > .gitignore
```

- [ ] **Step 2: Copy the already-extracted design file into the repo**

The clean extract exists at the scratchpad path used during brainstorming. Copy it; if absent, re-extract from the persisted `get_file` output, or re-pull via the DesignSync `get_file` method (project `c79597f0-6b3e-4b38-9350-224928905cd4`, path `Ragusia.dc.html`) and strip the JSON wrapper to get `.content`.

```bash
mkdir -p design/reference
cp "/private/tmp/claude-501/-Users-rinaldofesta-Projects-Personal-ragusia/483ae844-977f-4a36-a6aa-3522d96ab15c/scratchpad/Ragusia.dc.html" design/reference/Ragusia.dc.html
wc -l design/reference/Ragusia.dc.html   # expect 1775
```

- [ ] **Step 3: Pull support.js and the stemma asset via DesignSync**

Use DesignSync `get_file` for `support.js` → `design/reference/support.js`. Use DesignSync `get_file` for `ragusa-stemma.png` (binary; base64-decode) → `design/reference/ragusa-stemma.png`. Verify the PNG header:

```bash
file design/reference/ragusa-stemma.png   # expect: PNG image data
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "chore: preserve Ragusia design as in-repo reference"
```

---

## Milestone 1 — Foundation: scaffold, tokens, fonts, Supabase, Drizzle

### Task 1: Next.js + Tailwind v4 scaffold

**Files:**
- Create: `package.json`, `pnpm-lock.yaml`, `next.config.ts`, `tsconfig.json`, `app/layout.tsx`, `app/(shell)/layout.tsx`, `app/(shell)/page.tsx`, `styles/globals.css`, `postcss` config as required by Tailwind v4.

**Interfaces:**
- Produces: a running `pnpm dev` serving `/` with fonts + Tailwind active.

- [ ] **Step 1: Scaffold**

```bash
pnpm dlx create-next-app@latest . --ts --app --tailwind --eslint --src-dir=false --import-alias "@/*" --use-pnpm --no-turbopack
```
Accept overwrite of the empty dir. Confirm Tailwind v4 (`tailwindcss` v4 in `package.json`; `@import "tailwindcss";` in `app/globals.css` or `styles/globals.css`). If the scaffold produced `app/page.tsx`/`app/layout.tsx`, we will replace them below.

- [ ] **Step 2: Fonts via next/font**

In `app/layout.tsx`, load the four families with `next/font/google` and expose them as CSS variables on `<html>`:

```tsx
import { Spectral, Spectral_SC, Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "@/styles/globals.css";

const spectral = Spectral({ subsets: ["latin"], weight: ["400","500","600"], style: ["normal","italic"], variable: "--font-spectral" });
const spectralSC = Spectral_SC({ subsets: ["latin"], weight: ["500","600"], variable: "--font-spectral-sc" });
const hanken = Hanken_Grotesk({ subsets: ["latin"], weight: ["400","500","600","700"], variable: "--font-hanken" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400","500","600"], variable: "--font-mono" });

export const metadata = { title: "RagusIA — Intelligenza civica", description: "Un archivio che pensa — Comune di Ragusa." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${spectral.variable} ${spectralSC.variable} ${hanken.variable} ${mono.variable}`}>
      <head>
        <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css" />
        <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/thin/style.css" />
        <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/duotone/style.css" />
        <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/fill/style.css" />
        <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/bold/style.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Temporary home placeholder**

`app/(shell)/page.tsx` returns `<div>RagusIA</div>` for now (real Chiedi home arrives in Milestone 4). Delete the scaffold's `app/page.tsx` if it exists to avoid a route conflict.

- [ ] **Step 4: Run dev, verify**

Run: `pnpm dev` → open `/`. Expected: page renders, no console errors, fonts loaded (Network shows Hanken/Spectral).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: scaffold Next.js + Tailwind v4 + fonts"
```

### Task 2: Design tokens + globals

**Files:**
- Create: `styles/tokens.css`
- Modify: `styles/globals.css` (import tokens, set body)

**Interfaces:**
- Produces: Tailwind theme tokens consumed by every component. **Token-mapping rule** (used by all surface tasks): inline `color:var(--ink)` → `text-ink`; `background:var(--card-2)` → `bg-card-2`; `border:1px solid var(--line)` → `border border-line`; literal hex/rgba that has a token → token; bespoke one-off values that have no token → arbitrary value `text-[#6B6358]` / `bg-[rgba(194,151,42,0.07)]`. Fonts: `font:600 19px/1 'Spectral'` → `font-spectral text-[19px] font-semibold leading-none`.

- [ ] **Step 1: Write tokens.css**

```css
@import "tailwindcss";

@theme {
  --color-ink: #1C1A17;
  --color-ink-2: #5C554B;
  --color-ink-3: #8A8175;
  --color-paper: #F4EFE6;
  --color-card: #FBF8F1;
  --color-card-2: #FDFBF6;
  --color-sand: #EAE3D5;
  --color-sand-2: #E3DACA;
  --color-amber: #C2972A;
  --color-amber-d: #9B7517;
  --color-amber-tint: #EFE1BC;
  --color-teal: #2A66A8;
  --color-terra: #C0623D;
  --color-olive: #7E7A3F;
  --color-stone: #9B9385;
  --color-sky: #5B8CA3;
  --color-plum: #7A5160;
  --font-spectral: var(--font-spectral), serif;
  --font-spectral-sc: var(--font-spectral-sc), serif;
  --font-hanken: var(--font-hanken), system-ui, sans-serif;
  --font-mono: var(--font-mono), monospace;
}

:root {
  --ink:#1C1A17; --ink-2:#5C554B; --ink-3:#8A8175; --paper:#F4EFE6;
  --card:#FBF8F1; --card-2:#FDFBF6; --sand:#EAE3D5; --sand-2:#E3DACA;
  --line:rgba(28,26,23,0.10); --line-2:rgba(28,26,23,0.17);
  --amber:#C2972A; --amber-d:#9B7517; --amber-tint:#EFE1BC; --teal:#2A66A8;
  --terra:#C0623D; --olive:#7E7A3F; --stone:#9B9385; --sky:#5B8CA3; --plum:#7A5160;
}
/* line tokens as Tailwind colors (rgba) */
@theme { --color-line: rgba(28,26,23,0.10); --color-line-2: rgba(28,26,23,0.17); }

@keyframes ibFadeUp{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:translateY(0)}}
@keyframes ibBlink{0%,100%{opacity:1}50%{opacity:.15}}
@keyframes ibShimmer{0%{background-position:-280px 0}100%{background-position:280px 0}}
@keyframes ibSlideL{from{transform:translateX(26px);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes ibFade{from{opacity:0}to{opacity:1}}
@keyframes ibPulse{0%,100%{opacity:.35}50%{opacity:1}}

*{box-sizing:border-box}
html,body{margin:0;padding:0}
body{background:var(--paper);font-family:var(--font-hanken);-webkit-font-smoothing:antialiased}
::selection{background:rgba(194,151,42,0.22)}
::-webkit-scrollbar{width:11px;height:11px}
::-webkit-scrollbar-thumb{background:rgba(28,26,23,0.18);border-radius:7px;border:3px solid #F4EFE6}
::-webkit-scrollbar-track{background:transparent}
.leaflet-container{background:#0F1410;font-family:var(--font-hanken)}
.ib-pin{background:none!important;border:none!important}
.leaflet-bar a{background:#26201A;color:#EDE6D8;border-color:rgba(237,230,216,0.14)}
.leaflet-bar a:hover{background:#332B22;color:#fff}
.leaflet-control-attribution{background:rgba(20,17,13,0.72)!important;color:rgba(237,230,216,0.55)!important;font:400 9px var(--font-mono);padding:1px 6px}
.leaflet-control-attribution a{color:rgba(216,154,62,0.85)!important}
```

- [ ] **Step 2: globals imports tokens**

Set `styles/globals.css` to `@import "./tokens.css";` (remove the scaffold's default `@import "tailwindcss"` duplication — tokens.css already imports it).

- [ ] **Step 3: Verify a token class renders**

Temporarily set the home placeholder to `<div className="bg-paper text-ink font-spectral p-8">RagusIA</div>`; `pnpm dev` and confirm parchment background + serif text.

- [ ] **Step 4: Commit** — `git add -A && git commit -m "feat: design tokens + globals"`

### Task 3: Supabase local + Drizzle wiring

**Files:**
- Create: `supabase/config.toml` (via CLI), `drizzle.config.ts`, `lib/db/client.ts`, `.env.example`
- Add deps: `drizzle-orm`, `postgres`, `drizzle-kit` (dev), `dotenv-cli` (dev), `pgvector` types as needed.

> **Env loading (gotcha):** only Next.js auto-loads `.env`. Standalone tools — `drizzle-kit` and the `tsx` seed runner — do **not**. Always invoke them through `dotenv -e .env -- <cmd>` (e.g. `pnpm dotenv -e .env -- drizzle-kit generate`). Secrets live in `.env`/`.env*.local` (gitignored); commit only `.env.example`.

**Interfaces:**
- Produces: `db` (Drizzle client) from `lib/db/client.ts`; a running local Postgres with `vector` extension.

- [ ] **Step 1: Init + start Supabase**

```bash
supabase init
supabase start    # boots Postgres+pgvector via Docker; prints DB URL + keys
```
Copy the local connection string into `.env` as `DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres`. Write `.env.example` with the same keys but placeholder values, plus `EMBEDDINGS_PROVIDER=` (empty) and `OPENAI_API_KEY=`.

- [ ] **Step 2: Enable pgvector (migration)**

Create `supabase/migrations/0000_extensions.sql` with `create extension if not exists vector;` and run `supabase db reset` (applies migrations to local).

- [ ] **Step 3: Drizzle client**

```ts
// lib/db/client.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
const url = process.env.DATABASE_URL!;
export const sql = postgres(url, { prepare: false });
export const db = drizzle(sql, { schema });
```

- [ ] **Step 4: drizzle.config.ts**

```ts
import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./supabase/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

- [ ] **Step 5: Verify connection**

Add a one-off script or `pnpm dlx tsx -e` that runs `select 1`; expect `1`. (Schema arrives in Task 5.)

- [ ] **Step 6: Commit** — `git add -A && git commit -m "chore: supabase local + drizzle wiring"`

---

## Milestone 2 — Object model, seed, repository, search

### Task 4: Object-model types (the contract)

**Files:** Create `lib/model/types.ts`, `test/model.test.ts`

**Interfaces:**
- Produces (imported everywhere): the types below. Later tasks MUST use these exact names.

- [ ] **Step 1: Write types**

```ts
// lib/model/types.ts
export type SourceStatus = "ok" | "warn";

export interface Source {
  id: string; short: string; full: string; icon: string; what: string;
  url: string; license: string; format: string; retrieved: string;
  observed: string; rows: string; hash: string | null; status: SourceStatus; refresh: string;
}
export interface ProvenanceRef { sourceId: string; what?: string; observed?: string; status?: SourceStatus; }

export interface Entity { id: string; typeLabel: string; name: string; icon: string; sources: string[]; }
export interface Relation { from: string; to: string; label: string; dashed?: boolean; }

export interface Kpi { label: string; value: string; sub: string; sourceId?: string; srcVal?: string; srcTag?: string; status?: SourceStatus; est?: boolean; }
export interface Bar { label: string; value: string; sub?: string; pct: number; color: string; entityId?: string; code?: string; }
export interface TableRow { cells: string[]; entityId?: string; sourceId?: string; }

export interface DomainCard { slug: string; icon: string; name: string; value: string; sub: string; sourceId: string; srcVal: string; srcTag: string; status: SourceStatus; full?: boolean; }
export interface DomainDetail {
  slug: string; icon: string; title: string; sub: string; kind: "full" | "skeleton";
  kpis: Kpi[];
  chart?: { title: string; srcTag: string; sourceId: string; srcVal: string; bars: Bar[] };
  sources: string[];
  cta?: { label: string; entityId: string } | null;
}

export interface QA {
  id: string; question: string; entityIds: string[]; sourceIds: string[]; sql: string;
  body: "giunta" | "bilancio" | "appalti" | "pnrr" | "demografia" | "nomatch";
}
export interface Service {
  id: string; question: string; nome: string; icona: string; ufficio: string; sintesi: string;
  comeFare: string[]; cosaServe: string[]; dove: string; quando: string; costo: string; tempi: string;
  online: { label: string; url: string }; sourceId: string; fonteVal: string;
}
export interface DocItem { id: string; tipo: string; n: string; title: string; date: string; uff: string; sez: string; tags: string[]; hash: string | null; sourceId: string; }
export interface MapLayer { id: string; label: string; count: string; color: string; colorHex: string; icon: string; }
export interface MapMarker { id: string; layer: string; lat: number; lon: number; label: string; type: string; entityId?: string; sourceId?: string; }
export interface GraphType { id: string; label: string; count: string; color: string; }

export interface SourceHealth { total: number; ok: number; warn: number; lastRefresh: string; atRisk: string[]; }
```

- [ ] **Step 2: Trivial type-usage test** (compile guard)

```ts
// test/model.test.ts
import { expect, test } from "vitest";
import type { Source } from "@/lib/model/types";
test("Source shape compiles", () => {
  const s: Source = { id:"x", short:"X", full:"X full", icon:"ph-x", what:"", url:"", license:"", format:"", retrieved:"", observed:"", rows:"", hash:null, status:"ok", refresh:"" };
  expect(s.status).toBe("ok");
});
```

- [ ] **Step 3: Add Vitest**

```bash
pnpm add -D vitest @vitejs/plugin-react vite-tsconfig-paths
```
Create `vitest.config.ts` with `tsconfigPaths()` so `@/` resolves. Run `pnpm vitest run test/model.test.ts` → PASS.

- [ ] **Step 4: Commit** — `git add -A && git commit -m "feat: object-model types"`

### Task 5: Drizzle schema (tables + pgvector)

**Files:** Create `lib/db/schema.ts`; generate migration.

**Interfaces:**
- Consumes: `lib/model/types.ts`.
- Produces: tables `sources, entities, entity_sources, relations, domain_cards, domain_details, domain_kpis, domain_bars, governo, assessori, settori, elezione, candidati, liste, consiglieri, documents, services, qa, map_layers, map_markers, graph_types, embeddings`.

- [ ] **Step 1: Write schema** — model each table after the types in Task 4; store array/struct-ish fields (e.g. `Service.comeFare`, `qa.entityIds`, `domain_details.kpis`) as `jsonb` typed via `.$type<...>()`. Add `embeddings` with `vector("embedding", { dimensions: 1536 })` from `drizzle-orm/pg-vector` (or `customType`), columns `ownerType text`, `ownerId text`, `content text`. Example for two representative tables:

```ts
// lib/db/schema.ts (excerpt)
import { pgTable, text, integer, boolean, jsonb, doublePrecision, primaryKey } from "drizzle-orm/pg-core";
import { vector } from "drizzle-orm/pg-vector"; // if unavailable, define a customType('vector')
import type { Kpi, Bar } from "@/lib/model/types";

export const sources = pgTable("sources", {
  id: text("id").primaryKey(), short: text("short").notNull(), full: text("full").notNull(),
  icon: text("icon").notNull(), what: text("what").notNull(), url: text("url").notNull(),
  license: text("license").notNull(), format: text("format").notNull(), retrieved: text("retrieved").notNull(),
  observed: text("observed").notNull(), rows: text("rows").notNull(), hash: text("hash"),
  status: text("status").notNull().$type<"ok"|"warn">(), refresh: text("refresh").notNull(),
});

export const domainDetails = pgTable("domain_details", {
  slug: text("slug").primaryKey(), icon: text("icon").notNull(), title: text("title").notNull(),
  sub: text("sub").notNull(), kind: text("kind").notNull().$type<"full"|"skeleton">(),
  kpis: jsonb("kpis").$type<Kpi[]>().notNull(), chartTitle: text("chart_title"),
  chartSrcTag: text("chart_src_tag"), chartSourceId: text("chart_source_id"), chartSrcVal: text("chart_src_val"),
  chartBars: jsonb("chart_bars").$type<Bar[]>(), sources: jsonb("sources").$type<string[]>().notNull(),
  cta: jsonb("cta").$type<{label:string;entityId:string}|null>(),
});
export const embeddings = pgTable("embeddings", {
  id: text("id").primaryKey(), ownerType: text("owner_type").notNull(), ownerId: text("owner_id").notNull(),
  content: text("content").notNull(), embedding: vector("embedding", { dimensions: 1536 }),
});
```
Define the remaining tables analogously (one column per type field; jsonb for arrays/nested). Keep names snake_case in DB, camelCase in TS.

- [ ] **Step 2: Generate + apply migration**

```bash
pnpm dotenv -e .env -- drizzle-kit generate
supabase db reset   # re-applies 0000_extensions.sql + the generated migration
```
Expected: migration file in `supabase/migrations/`, `db reset` succeeds.

- [ ] **Step 3: Verify tables exist**

```bash
supabase db diff --schema public | head    # or psql \dt — expect the tables listed
```

- [ ] **Step 4: Commit** — `git add -A && git commit -m "feat: drizzle schema + pgvector"`

### Task 6: Seed data ported from the design

**Files:** Create `lib/data/seed/{sources,entities,suggested,qa,nav,domini,dash,giunta,elezione,domDetail,graph,map,docs,services,stub}.ts`

**Interfaces:**
- Produces: typed seed arrays/maps matching `lib/model/types.ts`, transcribed **verbatim** from `design/reference/Ragusia.dc.html`.

- [ ] **Step 1: Transcribe the literals.** Port each JS object literal from the design into a typed TS module, renaming fields to the Task-4 types (e.g. design `icona`→`Service.icona` kept; design `ent`→`entityId`; design `src`→`sourceId`; `srcTag`/`srcVal` kept). Source line ranges in `design/reference/Ragusia.dc.html`:
  - `sources` → lines **1083–1099**
  - `entities` → **1101–1120**
  - `suggested` → **1122–1128**; `suggestedServizi` → **1526–1532**
  - `qaMeta` → **1130–1142** (map `entities`→`entityIds`, `sources`→`sourceIds`, add `body` = the key)
  - `navItems` → **1144–1151**
  - `dominiCards` → **1153–1162** (`id`→`slug` stripping `dom-`; `src`→`sourceId`; `ok|warn`→`status`)
  - `dash.bilancio` (kpis/missioni/trend/capitoli) → **1164–1197**; `dash.appalti` (kpis/operatori/uffici/contratti) → **1198–1227**
  - `giunta` → **1230–1244**; `elezione` → **1246–1277**
  - `domDetail` (organigramma/opere/pnrr/demografia/ambiente/elezioni) → **1279–1304**
  - `graphTypes` → **1306–1325**; `graphColors` → **1327**; `graphModel` → **1329–1391**
  - `mapLayers` → **1416–1423**; `mapMarkers` → **1424–1439**
  - `docs` → **1440–1453**; `docSections` → **1454–1463**; `alboCats` → **1464–1469**; `docSuggested` → **1470**
  - `services` → **1493–1524**
  - `stubMeta` → **1534–1543**
  Keep all Italian strings + accents exactly. Keep the curated QA prose (the `<sc-if showGiunta/showBilancio/...>` blocks, design lines **159–301**) as `AnswerProse` JSX in Milestone 4 — not seed; seed only carries `qa` metadata.

- [ ] **Step 2: Spot-check test**

```ts
// test/seed.test.ts
import { expect, test } from "vitest";
import { sources } from "@/lib/data/seed/sources";
import { entities } from "@/lib/data/seed/entities";
test("sources: 14 entries, anac is warn", () => {
  expect(Object.keys(sources)).toHaveLength(14);
  expect(sources.anac.status).toBe("warn");
});
test("entities: sindaco maps to dait+eligendo", () => {
  expect(entities["sindaco-cassi"].sources).toEqual(["dait","eligendo"]);
});
```
Run → PASS.

- [ ] **Step 3: Commit** — `git add -A && git commit -m "feat: seed data ported from design"`

### Task 7: Normalize + seed runner

**Files:** Create `lib/data/normalize.ts`, `lib/data/adapters/index.ts` (Phase-1 adapters returning seed + provenance), `lib/db/seed.ts`; script entry in `package.json` (`"seed": "dotenv -e .env -- tsx lib/db/seed.ts"`).

**Interfaces:**
- Consumes: seed modules, `db`, schema.
- Produces: populated DB; `seedHealth(): SourceHealth` derivation used by the sidebar.

- [ ] **Step 1: Adapters return `{records, provenance}`** — one Phase-1 adapter per source id reading from `seed/sources.ts` (provenance = the source row itself). Interface:

```ts
export interface SourceAdapter { id: string; load(): Promise<{ provenance: Source }>; }
```

- [ ] **Step 2: Seed runner** — `lib/db/seed.ts` truncates + upserts every table from the seed modules (idempotent). Wrap in a transaction. If `EMBEDDINGS_PROVIDER` is set, compute + insert embeddings (Task 9); else skip.

- [ ] **Step 3: Run + verify**

```bash
pnpm seed
```
Then a Vitest that connects and asserts `select count(*) from sources` = 14, `entities` ≥ 19, `documents` = 12. PASS.

- [ ] **Step 4: Commit** — `git add -A && git commit -m "feat: normalize + idempotent seed runner"`

### Task 8: Repository (the UI data boundary)

**Files:** Create `lib/data/repository.ts`, `test/repository.test.ts`

**Interfaces:**
- Produces (the ONLY data API surfaces may import):

```ts
getSources(): Promise<Source[]>;
getSource(id: string): Promise<Source | null>;
getSourceHealth(): Promise<SourceHealth>;
getEntity(id: string): Promise<Entity | null>;
getEntitySources(id: string): Promise<Source[]>;
getNav(): Promise<{ id:string; label:string; icon:string; count:string }[]>;
getDominiCards(): Promise<DomainCard[]>;
getBilancio(): Promise<{ kpis:Kpi[]; missioni:Bar[]; trend:{y:string;v:number}[]; capitoli:TableRow[] }>;
getAppalti(): Promise<{ kpis:Kpi[]; operatori:Bar[]; uffici:Bar[]; contratti:TableRow[] }>;
getDomainDetail(slug: string): Promise<DomainDetail | null>;
getOrganigramma(): Promise<{ sindaco:any; assessori:any[]; settori:string[]; presidente:string }>;
getElezione(): Promise<{ data:string; affluenza:string; tipo:string; candidati:any[]; liste:any[]; consiglieri:any[]; presidente:string }>;
getGraph(): Promise<{ nodes: GraphNode[]; links: GraphLink[]; types: GraphType[] }>;   // GraphNode/Link from Task 12
getMap(): Promise<{ layers: MapLayer[]; markers: MapMarker[] }>;
getDocuments(): Promise<DocItem[]>;
getDocSections(): Promise<{ id:string; label:string; count:string }[]>;
getAlboCats(): Promise<{ id:string; label:string; count:string }[]>;
getQA(id: string): Promise<QA | null>;
getService(id: string): Promise<Service | null>;
routeQuestion(q: string): Promise<{ kind:"qa"|"service"|"nomatch"; id: string }>;
searchDocuments(q: string, filter?: string): Promise<DocItem[]>;
```

- [ ] **Step 1: Write failing test**

```ts
// test/repository.test.ts
import { expect, test } from "vitest";
import * as repo from "@/lib/data/repository";
test("getSourceHealth: 12 fonti, anac at risk", async () => {
  const h = await repo.getSourceHealth();
  expect(h.total).toBe(12);
  expect(h.warn).toBe(1);
  expect(h.atRisk).toContain("ANAC");
});
```
Note: `getSourceHealth` counts the 12 *registry* sources (the `fontiOrder` list, design line 1661), not all 14 rows (`atto`/`comune`/`anpr` are service/portal, excluded from the registry count). Encode that list in the repo.

- [ ] **Step 2: Run → FAIL.** `pnpm vitest run test/repository.test.ts` → fail (not implemented).

- [ ] **Step 3: Implement repository** with Drizzle queries; derive computed shapes (health, bar widths left to UI). Port `fontiOrder` (line 1661) for the registry/order.

- [ ] **Step 4: Run → PASS.**

- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: repository data boundary"`

### Task 9: Search — deterministic matcher + optional embeddings

**Files:** Create `lib/search/matcher.ts`, `lib/search/embeddings.ts`, `test/matcher.test.ts`

**Interfaces:**
- Produces: `matchQA(q:string): string` (returns qa/service id or `"nomatch"`), `docTokens(q:string): string[]`, `docMatches(doc:DocItem, tokens:string[]): boolean`, `embedText(text:string): Promise<number[]|null>` (null when no provider).

- [ ] **Step 1: Failing tests** (port the exact regex cases from design lines **1562–1576** and the doc tokenizer from **1648–1655**):

```ts
import { expect, test } from "vitest";
import { matchQA, docTokens } from "@/lib/search/matcher";
test.each([
  ["Dove faccio la carta d'identità?", "svc-cie"],
  ["Chi compone la giunta Cassì?", "giunta"],
  ["Quanto vale il bilancio 2024?", "bilancio"],
  ["chi ha vinto più appalti?", "appalti"],
  ["quanti progetti pnrr?", "pnrr"],
  ["quanti residenti stranieri?", "demografia"],
  ["qual è il colore preferito del sindaco?", "nomatch"],
])("matchQA(%s)=%s", (q,e)=>expect(matchQA(q)).toBe(e));
test("docTokens strips stopwords + truncates to 5", () => {
  expect(docTokens("trovami le delibere di giunta")).toEqual(["delib","giunt"]);
});
```

- [ ] **Step 2: Run → FAIL.**
- [ ] **Step 3: Implement** — transcribe `matchQA` regex chain (1562–1576) and the `dStop`/`dtoks` logic (1648–1655) exactly. `embeddings.ts`: if `process.env.EMBEDDINGS_PROVIDER` unset, `embedText` returns `null`; else call the provider via AI SDK.
- [ ] **Step 4: Run → PASS.**
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: deterministic matcher + optional embeddings"`

### Task 10: Graph layout math

**Files:** Create `lib/graph/layout.ts`, `test/graph.test.ts`

**Interfaces:**
- Produces: `GraphNode { id; cx; cy; r; tier:"center"|"hub"|"leaf"; type; color; label; entityId?; serviceId?; sourceId? }`, `GraphLink { from; to; label; dashed; A:GraphNode; B:GraphNode }`, `buildGraph(model, colors): { nodes; links; W; H }`.

- [ ] **Step 1: Failing test** — port `_buildGraph` (design **1393–1414**); assert the center node is at `(680,470)`, there are 10 clusters, hub radius 252, and edge count = Σleaves + crosses.

- [ ] **Step 2: Run → FAIL → Step 3: implement verbatim math → Step 4: PASS.**
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: object-graph layout math"`

---

## Milestone 3 — Shell + primitives + provenance drawer

### Task 11: Design-system primitives

**Files:** Create `components/primitives/*.tsx`, `test/primitives.test.tsx`

**Interfaces:**
- Produces: `SourceChip`, `KpiCard`, `BarRow`, `SectionCard`, `EntityRef`, `SuggestionChip`, `Cite`, `AnswerProse`, `Breadcrumb`, `StatTriple`, `DataStatus`. Props derived from the design's repeated markup.

`SourceChip` props: `{ sourceId:string; what?:string; status:"ok"|"warn"; est?:boolean; tag:string; size?:"sm"|"md"; onOpen:(sourceId,what)=>void }` → the pill with the colored dot (teal=ok, amber-fill=warn, amber-outline=est). Markup reference: design lines **321–325 / 348–352 / 663–666**.

`BarRow` props: `{ label; value; sub?; pct:number; color:string; code?; entityId?; onEntity?:(id)=>void }` → reference **360–368** (bilancio) / **441–449** (operatori).

`KpiCard` props: `{ label; value; sub; chip?:SourceChipProps }` → reference **343–354**.

`EntityRef` props: `{ entityId; children; onEntity }`. `Cite` (inline pill inside prose) props mirror `SourceChip` but `vertical-align:3px` inline. `AnswerProse` is a styled `<div>` wrapper (Spectral 17.5px/1.72) — reference **160–166**.

- [ ] **Step 1: Failing test** — render `SourceChip` with `status="warn"`, assert it shows the warn dot styling and calls `onOpen("anac","x")` on click (React Testing Library + Vitest jsdom).
- [ ] **Step 2: FAIL → Step 3: implement each primitive with Tailwind tokens per the mapping rule → Step 4: PASS.**
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: design-system primitives"`

### Task 12: Sidebar shell + DataStatus

**Files:** Create `components/primitives/Sidebar.tsx`, `NavItem.tsx`, `app/(shell)/layout.tsx`

**Interfaces:**
- Consumes: `repo.getNav`, `repo.getSourceHealth`. Active state from `usePathname`.
- Produces: the persistent 250px sidebar (stemma + RagusIA wordmark + motto + ente card + nav + data-status footer). Reference design lines **46–87**.

- [ ] **Step 1:** Move `ragusa-stemma.png` to `public/`. Build `Sidebar` (server component reading repo; nav active via a small client `NavItem`). Footer shows `11/12 fonti ok`, `ultimo refresh · 30/06 03:12`, `1 fonte a rischio · ANAC` from `getSourceHealth`.
- [ ] **Step 2:** `(shell)/layout.tsx` = `<div flex h-screen><Sidebar/><main class="flex-1 overflow-y-auto …">{children}</main><ProvenanceDrawer/></div>` with the diagonal-hatch `background-image` from design line 90.
- [ ] **Step 3: Verify** `pnpm dev` → sidebar renders on `/`, nav highlights current route.
- [ ] **Step 4: Commit** — `git add -A && git commit -m "feat: sidebar shell + data status"`

### Task 13: Provenance drawer (global, URL-driven)

**Files:** Create `components/primitives/ProvenanceDrawer.tsx`, `test/drawer.test.tsx`

**Interfaces:**
- Consumes: `?fonte=<sourceId>&val=<what>` search params; `repo.getSource`.
- Produces: the right-side drawer (reference **1006–1052**); `openProv(sourceId, what)` helper that pushes the search param; `closeProv()` removes it.

- [ ] **Step 1: Failing test** — given `?fonte=anac`, the drawer shows "ingestione a rischio", license `CC-BY 4.0`, format `JSON / CSV`, and an "Apri la fonte originale" link to `dati.anticorruzione.it`.
- [ ] **Step 2: FAIL → Step 3: implement** as a client component reading `useSearchParams`; data fetched via a server route handler `app/api/source/[id]/route.ts` or passed from a server wrapper. The "Vedi nel registro Fonti" button navigates `/fonti`. → **Step 4: PASS.**
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: provenance drawer"`

---

## Milestone 4 — Chiedi (home + ask + answer)

### Task 14: Chiedi home

**Files:** Create `app/(shell)/page.tsx`, `components/features/AskBox.tsx`

**Interfaces:** Consumes `repo` (suggested, suggestedServizi, stats). Reference design **92–139**.

- [ ] **Step 1:** Build the hero (date/ente line, `Chiedi qualcosa su Ragusa.`, subtitle), the ask form (`AskBox` client component: input + submit → `router.push('/chiedi?q='+q)`), suggested civic chips + service chips (→ `/chiedi?qa=<id>`), and the stats triple (≈7.400 / ≈18.200 / 12).
- [ ] **Step 2: Verify** render + chip navigation.
- [ ] **Step 3: Commit** — `git add -A && git commit -m "feat: Chiedi home"`

### Task 15: Ask flow + answer view

**Files:** Create `app/(shell)/chiedi/page.tsx`, `components/features/AnswerView.tsx`, `components/features/answers/{Giunta,Bilancio,Appalti,Pnrr,Demografia,Nomatch,Service}.tsx`

**Interfaces:** Consumes `repo.routeQuestion`, `repo.getQA`, `repo.getService`, `repo.getEntity`, `repo.getSource`. Reference design **140–301**.

- [ ] **Step 1:** `chiedi/page.tsx` resolves the target: `?qa=<id>` → that QA/service; `?q=<text>` → `routeQuestion` (semantic if available, else `matchQA`). Pass to `AnswerView`.
- [ ] **Step 2:** `AnswerView` (client) runs the staged reveal: `thinking` (shimmer ~760ms, "Consulto N fonti · M entità…") → `answer` → `evidence` (reveal≥2). Renders the matching curated `answers/*` block (the bespoke Spectral prose with inline `Cite` chips, ported verbatim from the design's `showGiunta/...` blocks), then the shared **"Da dove arriva"** evidence (entities cited + sources used) and the **"Mostra la query"** SQL reveal (dark code block). Service answers render the `Service` card (come fare / cosa serve / dove-quando-costo-tempi + online CTA) — reference **205–260**.
- [ ] **Step 3:** Inline `Cite` chips and evidence buttons call `openProv`. "Apri la dashboard Bilancio/Appalti" buttons navigate the domain routes.
- [ ] **Step 4: Verify** all six answer bodies + nomatch + a service answer render and reveal correctly.
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat: ask flow + answer view"`

---

## Milestone 5 — Domini + dashboards

### Task 16: Domini overview

**Files:** `app/(shell)/domini/page.tsx`. Consumes `repo.getDominiCards`. Reference **302–330**.
- [ ] Build the 8-card grid (icon, name, value, sub, "completa" badge for full, source chip → drawer; card click → `/domini/<slug>`). Verify. Commit `feat: domini overview`.

### Task 17: Bilancio dashboard

**Files:** `app/(shell)/domini/bilancio/page.tsx`. Consumes `repo.getBilancio`. Reference **332–405**.
- [ ] Breadcrumb, header + BDAP chip, 4 KPIs, spesa-per-missione `BarRow`s (entity-linked), trend SVG sparkline (port the `trendPoints/trendArea/trendDots` math from **1683–1688** into a small helper), corrente/capitale split bar, capitoli table. Verify. Commit `feat: Bilancio dashboard`.

### Task 18: Appalti dashboard

**Files:** `app/(shell)/domini/appalti/page.tsx`. Consumes `repo.getAppalti`. Reference **407–483**.
- [ ] Breadcrumb, header, the ANAC **risk banner** (0 righe), 4 KPIs (warn chips), top operatori + per-ufficio `BarRow`s, recent-contracts table (operator → entity card, per-row ANAC seal chip → drawer). Verify. Commit `feat: Appalti dashboard`.

### Task 19: Generic domain detail

**Files:** `app/(shell)/domini/[slug]/page.tsx`. Consumes `repo.getDomainDetail`. Reference **627–676**. Slugs: `opere|pnrr|demografia|ambiente` (404 otherwise).
- [ ] KPIs + chart `BarRow`s + sources chips + optional entity CTA + "ossatura" note linking Bilancio/Appalti. Verify each slug. Commit `feat: generic domain detail`.

### Task 20: Organigramma

**Files:** `app/(shell)/domini/organigramma/page.tsx`. Consumes `repo.getOrganigramma`. Reference **485–560**.
- [ ] Sindaco card (→ entity), giunta grid (9, initials helper from **1677**), consiglio block (presidente + maggioranza/opposizione + link to Elezioni), 11 settori chips. Verify. Commit `feat: Organigramma`.

### Task 21: Elezioni

**Files:** `app/(shell)/domini/elezioni/page.tsx`. Consumes `repo.getElezione`. Reference **562–625**.
- [ ] 4 KPIs, candidati bars (width = pct/cmax, **1679–1680**), liste bars (pct/lmax), consiglieri-per-lista list, Eligendo chips, the assessori-cede-seggio note. Verify. Commit `feat: Elezioni`.

---

## Milestone 6 — Esplora (object graph)

### Task 22: ObjectGraph feature

**Files:** Create `components/features/ObjectGraph.tsx` + `ObjectGraph.module.css`, `app/esplora/page.tsx` (full-bleed, no shell). Consumes `repo.getGraph` + `lib/graph/layout.ts`. Reference **678–734** + render logic **1690–1713**.

**Interfaces:** Consumes `GraphNode/GraphLink` (Task 10).

- [ ] **Step 1:** `esplora/page.tsx` server-loads the graph, renders a client `ObjectGraph`. Dark "inchiostro" theme; left sidebar = 17 `graphTypes` (click → filter). Canvas: pan (mousedown-drag), wheel zoom (clamp 0.3–2.4), zoom controls + reset (`zoomPct`). Nodes as positioned buttons (center/hub/leaf sizes), edges as rotated divs (port `graphLinks` angle/len math **1705–1712**), relation labels (toggle via `relazioniGrafo`). Hover → adjacency highlight (`near/lit` from **1692–1704**). Node click → `/entita/<ent>` or `openProv(src)` or service ask.
- [ ] **Step 2: Verify** pan, zoom, type filter, hover highlight, node navigation. Commit `feat: Esplora object graph`.

---

## Milestone 7 — Mappa (Leaflet)

### Task 23: TerritoryMap feature

**Files:** Create `components/features/TerritoryMap.tsx` + `.module.css`, `app/mappa/page.tsx` (full-bleed). Add deps `leaflet`, `@types/leaflet`. Consumes `repo.getMap`. Reference **736–778** + `initMap` **1593–1636**.

- [ ] **Step 1:** Client component (Leaflet needs `window`; load via dynamic import / `useEffect`). Map centered `[36.862,14.655]` zoom 11; tile layers satellite (Esri World Imagery + Reference labels) / stradale (CARTO light); vista toggle. Layer panel (6 toggles, port `activeLayers` default **1074**). Custom div-icon pins per layer color; marker click → selected-marker card (→ entity or source). ISTAT confini chip → drawer.
- [ ] **Step 2: Verify** map loads, tiles switch, layers toggle, marker card opens. Commit `feat: Mappa territory map`.

---

## Milestone 8 — Documenti + Fonti + Entità

### Task 24: Documenti

**Files:** `app/(shell)/documenti/page.tsx`, `components/features/DocSearch.tsx`. Consumes `repo.getDocuments/getDocSections/getAlboCats/searchDocuments`. Reference **780–849**.
- [ ] NL search form (semantic if available, else token matcher + filters), suggested queries, AmmTrasparente + Albo filters (sidebar, sticky), result cards (atto link, source chip → drawer, hash line). Verify search + filter. Commit `feat: Documenti`.

### Task 25: Fonti registry

**Files:** `app/(shell)/fonti/page.tsx`. Consumes `repo.getSources/getSourceHealth`. Reference **851–886** (+ the registry list logic **1661–1664**).
- [ ] Header + totals (12 / ok / warn), per-source rows (health dot, short, full, what, license, format, rows, refreshShort) → row click opens drawer. Verify. Commit `feat: Fonti registry`.

### Task 26: Entità cards

**Files:** `app/(shell)/entita/[id]/page.tsx`. Consumes `repo.getEntity/getEntitySources` + appalti dataset for operatore/settore. Reference **887–990** + the computed `opMeta/opContratti/showSettore/showOpera/isOperatore/showGenericEntity` (**1664–1768**).
- [ ] Header + "composta da" source chips; bodies: **Settore** (KPIs + responsabile + contratti collegati), **Operatore** (`opMeta` value/sub + committente + `opContratti` table), **Opera** (KPIs + catena di provenienza + localizzazione SVG + "Apri nella Mappa"), **generic** (synthesis + cross-links). Back button uses `prevSurface` (referrer or `?from=`). Verify the four body types. Commit `feat: Entità cards`.

---

## Milestone 9 — Verification, polish, deploy-ready

### Task 27: Cross-surface verification + browser run

**Files:** `test/smoke.test.ts`, `README.md`
- [ ] **Step 1:** Smoke test: every route renders (200, no thrown error) against the seeded local DB.
- [ ] **Step 2:** Run the app and walk the key flows in a real browser (use the agent-browser skill): ask → answer → drawer; domini → bilancio → entity (missione); appalti risk banner + contract → operatore card; esplora pan/zoom/filter/hover; mappa layers/vista/marker; documenti search; fonti → drawer. Capture a screenshot per surface; fix visual drift against the design.
- [ ] **Step 3:** `README.md`: setup (`pnpm i`, `supabase start`, `supabase db reset`, `pnpm seed`, `pnpm dev`), the optional `EMBEDDINGS_PROVIDER` note, the Phase-2 adapter roadmap + source feasibility tiers.
- [ ] **Step 4:** `pnpm build` succeeds (typecheck + lint clean). Commit `chore: smoke tests + README + build green`.

### Task 28: Deploy-ready checkpoint

- [ ] **Step 1:** Confirm `.env.example` complete; `.env` gitignored. Document hosted-Supabase migration (Phase 2 / deploy): `supabase link`, push migrations, set `DATABASE_URL` + keys in Vercel env, run seed against hosted.
- [ ] **Step 2:** Final `superpowers:requesting-code-review` pass over the diff; address findings. Commit `chore: phase 1 complete`.

---

## Self-Review

**Spec coverage:** Every spec section maps to tasks — §3 stack → T1–T3; §4.1 routing → T12,14–26; §4.2 data layer → T7,8; §4.3 schema → T5; §4.4 ask/semantic → T9,15; §4.5 tiers → README (T27); §5 design system → T2,11–13; §6 surfaces (1–14) → T14–T26; §8 testing → T4,6,8,9,10,11,13,27; §9 phasing → whole plan + T28. No gaps.

**Placeholder scan:** Code-bearing logic tasks (types, schema, repo, matcher, graph) carry full code; UI port tasks cite exact `design/reference/Ragusia.dc.html` line ranges (the in-repo source of truth) + the Task-2 token-mapping rule + Task-11 primitives — this is DRY, not a placeholder. No "TBD/TODO/handle edge cases".

**Type consistency:** All tasks consume the Task-4 names (`Source.status:'ok'|'warn'`, `entityId`, `sourceId`, `ProvenanceRef`, `DomainDetail`, `Kpi/Bar/TableRow`, `GraphNode/GraphLink`). Repository signatures in T8 are the names surfaces import in T12–T26. `SourceChip`/`BarRow`/`KpiCard` props defined in T11 are reused unchanged. `getSourceHealth` (registry = 12) is consistent between T8 and T25.
