# RagusIA — Surface Implementation Guide (for surface builders)

You are building ONE surface of RagusIA (Next.js 16 App Router + React 19 + Tailwind v4).
Read this guide, then your task brief, then port the markup from `design/reference/Ragusia.dc.html`.

## Hard rules
- **Data only via the repository.** Import from `@/lib/data/repository`. NEVER import from
  `@/lib/data/seed/*` or `@/lib/db/*` in a surface. NEVER query the DB directly.
- **Copy is Italian, verbatim** from the design. Preserve accents/punctuation exactly
  (`città`, `«Peppe»`, `’`, `·`, `—`, `€`).
- **Match the mockup.** Convert the design's inline styles to Tailwind tokens (mapping below);
  use arbitrary values (`text-[#6B6358]`, `bg-[rgba(194,151,42,0.07)]`, `w-[250px]`) for
  one-offs. Keep exact px sizes, weights, colors.
- **Pages are async Server Components** that `await` repository functions. Add interactivity
  with small `"use client"` components only where needed (forms, pan/zoom, map, search inputs).
- Do NOT run `git`, `pnpm build`, `pnpm dev`, or `tsc` (other builders are working in the same
  tree concurrently — concurrent builds collide). Write correct code per the spec; the
  controller typechecks + builds afterward.
- Create ONLY the files your brief lists.

## Token mapping (inline style → Tailwind)
- `color:var(--ink)` → `text-ink`; `--ink-2/-3`, `--amber-d`, `--teal`, `--terra`, `--olive`,
  `--stone`, `--sky`, `--plum` are all tokens (`text-amber-d`, `bg-teal`, …).
- `background:var(--card-2)` → `bg-card-2`; `--paper/--card/--sand/--sand-2/--amber/--amber-tint`.
- `border:1px solid var(--line)` → `border border-line`; `--line-2` → `border-line-2`.
- `font:600 19px/1 'Spectral'` → `font-spectral text-[19px] font-semibold leading-none`.
  Families: `font-spectral`, `font-spectral-sc`, `font-hanken`, `font-mono`.
- Bespoke rgba/hex with no token → arbitrary value, e.g. `text-[#6B6358]`,
  `bg-[rgba(28,26,23,0.028)]`, `shadow-[0_10px_30px_rgba(28,26,23,0.055)]`.
- Dynamic numeric widths/colors from data → inline `style={{ width: `${pct}%`, background: color }}`.
- Phosphor icons: use `<Icon name="ph-foo" weight="duotone" className="text-[18px] text-amber-d" />`
  (weights: regular | duotone | thin | fill | bold). `<i class="ph-duotone ph-x">` → `weight="duotone"`.

## Primitives — `@/components/primitives/kit` (server-safe)
- `Icon({ name, weight?, className?, style? })`
- `SectionCard({ children, className?, padded? })` — bg-card-2 + border-line + rounded-14, p-[19px_20px] by default.
- `KpiCard({ label, value, sub?, chip? })` — chip is `ChipProps`.
- `BarRow({ label, value, pct, color, code?, entityId? })` — labelled progress bar; links to `/entita/{entityId}` when given.
- `Breadcrumb({ trail: { label, href? }[] })`
- `AnswerProse({ children })` — Spectral 17.5/1.72 wrapper.
- `EntityRef({ id, className?, children })` — Link to `/entita/{id}`.
- `SuggestionChip({ href, icon, label, accent? })` — accent "amber" | "teal".
- `type ChipProps = { sourceId: string; what?: string; dot?: "ok"|"warn"|"est"; tag: string }`

## Primitives — `@/components/primitives/provenance` (client)
- `SourceChip({ sourceId, what?, dot?, tag })` — the provenance pill; opens the drawer.
- `Cite({ sourceId, what?, dot?, tag })` — inline citation chip for use inside answer prose.
- `ProvDot({ dot, size? })`; `useProvenance() → { open(sourceId, what?), close() }`.
- The drawer is global (already mounted in the shell). To open provenance, just render a
  `SourceChip`/`Cite`, or call `useProvenance().open(id, what)` from a client component.
  Dot meaning: teal `ok`, amber-filled `warn` (a rischio), amber-outline `est` (stima/da verif.).

## Repository — `@/lib/data/repository` (all async)
`getSources()`, `getSource(id)`, `getFontiRegistry()`, `getSourceHealth()`,
`getEntity(id)`, `getEntitySources(id)`, `getOperatore(entityId) → { meta: Bar|null, contratti: ContrattoRow[] }`,
`getNav()`, `getSuggested() → { civica, servizi }`, `getDominiCards()`,
`getDomainDetail(slug)`, `getBilancio()`, `getAppalti()`, `getOrganigramma()`, `getElezione()`,
`getGraph() → { nodes, links, types, W, H }`, `getMap() → { layers, markers }`,
`getDocuments()`, `getDocSections() → { trasparente, albo }`, `searchDocuments(q, filter?)`,
`getQA(id)`, `getService(id)`, `routeQuestion(q) → { kind: "qa"|"service"|"nomatch", id }`.
All model types are in `@/lib/model/types` (Source, Entity, Kpi, Bar, DomainCard, DomainDetail,
BilancioData, AppaltiData, Organigramma, Elezione, DocItem, DocSection, MapLayer, MapMarker,
GraphNode, GraphLink, GraphTypeMeta, QA, Service, SuggestedQuestion, ContrattoRow, CapitoloRow, …).

## Routes (surface → path)
`/` Chiedi home · `/chiedi?q=&qa=` answer · `/esplora` · `/domini` · `/domini/bilancio` ·
`/domini/appalti` · `/domini/organigramma` · `/domini/elezioni` · `/domini/[slug]`
(opere|pnrr|demografia|ambiente) · `/mappa` · `/documenti?q=&sez=` · `/fonti` · `/entita/[id]`.
Provenance opens via the `?fonte=&val=` param the SourceChip/Cite set automatically — do not build it by hand.

## Layout notes
- Scrollable pages: a centered container, e.g. `max-w-[1180px] mx-auto px-9 pt-6 pb-[70px]`
  (match the design's exact max-width/padding per surface).
- Full-bleed surfaces (Esplora dark, Mappa parchment) render `absolute inset-0` inside `main`
  (the shell `main` is `relative`). Use the design's exact dark/parchment backgrounds.
- Next 16 dynamic route params are async: `({ params }: { params: Promise<{ id: string }> })`,
  then `const { id } = await params;`. searchParams likewise: `Promise<{ [k]: string|undefined }>`.
