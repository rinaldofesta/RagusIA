# RagusIA — Reliability Roadmap

> Status: **active** (written 2026-07-07, after the code-review/hardening batch `3ee246c`).
> Staged for a solo developer: eliminate silent failures first, lock the security boundary
> before anything is hosted, then deploy, then polish. When a milestone starts, spin an
> execution plan under `docs/superpowers/plans/` per existing convention.

Sizes: S ≈ hours · M ≈ a day-ish.

## M1 — "Fail loud" (quality gate + config honesty)

*Definition of done: a broken commit cannot land silently; a degraded ingest cannot pass
silently; a misconfigured process refuses to boot; the schema-sync invariant is machine-checked.*

| # | Item | Why | Size |
|---|---|---|---|
| 1.1 | **CI quality gate** — `.github/workflows/ci.yml`: lint + typecheck + build + full vitest on push/PR. DB-needing tests (`query`, `repository`, `seed`): run the Supabase CLI stack in the job (`supabase/setup-cli`, `supabase db start` + reset + `pnpm seed`); split unit/integration only if wall time exceeds ~5 min | Nothing runs lint/typecheck/test/build automatically today — only ingestion is automated | M |
| 1.2 | **Ingest alerting** — `lib/data/ingest/run.ts` must exit non-zero when any source ends `warn` or guard-blocked (today it exits 0, so the scheduled Action can never notify); add a per-source `$GITHUB_STEP_SUMMARY` table (status/rows/guard/note). GitHub-native notifications; a webhook step (Telegram/Slack) can come later | A count-guard block or dead source is currently invisible unless someone opens the app | S |
| 1.3 | **Env validation fail-fast** — small hand-rolled `lib/env.ts` (no new dep): `DATABASE_URL` required in production (kill the silent localhost fallback in `lib/db/client.ts`; dev keeps it with an explicit log line); reject unknown `EMBEDDINGS_PROVIDER`/`QUERY_PROVIDER` values naming `gateway` (ADR-0003); remove the dead `@ai-sdk/openai` dependency | A misconfigured prod currently points at localhost and fails obscurely; `EMBEDDINGS_PROVIDER=openai` is a silent no-op | S |
| 1.4 | **Security headers + input caps** — real `headers()` in `next.config.ts` (`X-Content-Type-Options`, `Referrer-Policy`, `frame-ancestors`, HSTS; CSP report-only first — Leaflet tile hosts need `img-src`); cap `q` at ~500 chars server-side before matcher/engine; validate `/api/source/[id]` against the registry | No security headers exist; an unbounded `q` flows straight into the LLM path | S |
| 1.5 | **Schema-sync test** — assert `ALLOWED_TABLES`/`FACT_SOURCES` (engine) match the Drizzle schema table names and that `SCHEMA_CONTEXT` mentions each | The fact-table shape is hand-synced in 3 places (ADR-0001); a machine check gets most of the unification value with zero churn to the hardened engine | S |
| 1.6 | **Migration-0002 loudness** — error-level log when `QUERY_PROVIDER` is enabled but the `query_reader` probe fails; surface in the M3 health endpoint | The strongest DB boundary currently degrades silently if migration 0002 didn't run | S |

## M2 — "Lock the doors" (security boundary + fragile-parse tests)

*Definition of done: the database is unreadable except through the app; every adapter parser has
recorded-fixture tests.*

| # | Item | Why | Size |
|---|---|---|---|
| 2.1 | **RLS deny-all, migration 0003** — enable RLS on all public tables (deny-all for `anon`/`authenticated`) **plus explicit `FOR SELECT TO query_reader USING (true)` policies on exactly the six allowlisted tables** — `query_reader` does not bypass RLS; without those policies the NL→SQL path breaks (the owning app role is unaffected). At deploy time, *also* remove `public` from the hosted Data API exposed schemas. Update `test/query.test.ts` expectations | The Supabase Data API (REST/GraphQL) exposes the `public` schema, bypassing the entire NL→SQL hardening story — the single biggest hole before hosting | M |
| 2.2 | **Rate limiting** on the expensive path — Postgres fixed-window limiter (`rate_limits` table, key = IP + minute) gating `answerWithSql()`; looser threshold on `/api/source`. No new infra; works local and hosted | One LLM call per unauthenticated request today | M |
| 2.3 | **Adapter tests with recorded fixtures** — `test/adapters/` + truncated real payloads in `test/fixtures/<source>/`; extract pure `parse*()` functions where fetch/parse are entangled. Priority: `anac` (zip + national CSV CF filter), `bdap` (ISO-8859-1 zip CSV), `istat` (SDMX), then the rest | The most failure-prone code in the repo (remote gov CSV/zip/SDMX parsing) has zero coverage | M |
| 2.4 | **Staleness alerting** — fail the ingest Action when a source's last `ok` run in `ingest_runs` is older than 7 days | A source can rot at `warn` indefinitely with only a UI dot to show for it | S |
| 2.5 | **Activate the `query_reader` DB backstop** — add a dedicated LOGIN role (e.g. `ragusia_app`) granted `query_reader WITH SET TRUE`, and connect the app as it via `DATABASE_URL` (instead of Supabase's reserved `postgres`, which can't be granted SET — see ADR-0001). Then `execReadOnly`'s `SET LOCAL ROLE` actually engages and the DB-boundary test runs instead of skipping | Today the DB-level least-privilege boundary is inert under `postgres`; the allowlist + read-only tx are the only NL→SQL guard | M |

## M3 — "Ship it" (deploy + performance)

*Definition of done: production on Vercel + hosted Supabase; daily-changing data served from
cache; guard rails hold against the hosted DB.*

> **Status:** the code-side prep is merged — pool tuning (3.1), `/api/health` (3.4), and the
> secondary indexes (3.5, migration 0005). The interactive deploy (3.1 provisioning, 3.2 Vercel),
> the dedicated-role activation (M2.5), and caching (3.3) need cloud accounts and are captured as
> a runbook in `docs/DEPLOY.md`.

| # | Item | Why | Size |
|---|---|---|---|
| 3.1 | **Hosted Supabase** — provision, `supabase link`, push migrations 0000–0003, seed, disable public Data API exposure, repoint the Action's `DATABASE_URL` secret. Pool tuning in `lib/db/client.ts` (`max` ≈ 5, `idle_timeout`) for serverless. (Connect as the dedicated app role from M2.5 so the `query_reader` backstop is live, not the reserved `postgres`.) | Deploy prerequisite | M |
| 3.2 | **Vercel deploy** — env via `vercel env` (`DATABASE_URL`, `QUERY_PROVIDER=gateway`, `QUERY_MODEL`, `EMBEDDINGS_PROVIDER`); AI Gateway auth is OIDC on Vercel (no key); the M1 CI is the gate | The point of it all | S |
| 3.3 | **Caching** — ISR (`export const revalidate = 3600`) on the read-only surfaces (`domini/*`, `fonti`, `esplora`, `mappa`, `documenti`, `entita/[id]`); `/chiedi` stays dynamic. Later refinement: `use cache` + on-demand revalidation pinged by the ingest Action after a successful run | Everything is `force-dynamic` today — a DB round-trip per page view for data that changes at most daily | S |
| 3.4 | **Health endpoint** — `/api/health`: `{ db, sourcesOk, queryRoleApplied, lastIngestAt }`; pluggable into any uptime monitor; surfaces the 1.6 role check | No way to monitor the deployment from outside | S |
| 3.5 | **Secondary indexes, migration 0004** — from observed query shapes: `fact_contracts(year)`, `fact_budget(year, missione)`, `fact_pnrr(missione)`, `fact_coesione(status)`, `ingest_runs(source_id, ran_at desc)` (read by the count-guard baseline on every ingest) | Tables are PK-only today; fine at current size, cheap to fix before it matters | S |

## M4 — "Keep it honest" (observability + polish, ongoing)

| # | Item | Why | Size |
|---|---|---|---|
| 4.1 | **Observability decision: no new vendor now** — Vercel runtime logs + error boundaries + `/api/health` + Action summaries are the MVP; add Sentry/log drain only when there are real users | Right-sized for a solo civic project | S |
| 4.2 | **UI component tests** for logic-bearing components (`AtRiskBanner` conditionality, provenance chip/dot resolution) — `@testing-library/react` is installed and unused | The conditional-health UI is the app's core promise | M |
| 4.3 | **E2E smoke** post-deploy — 3 routes + one `/chiedi` question (Playwright or agent-browser) | Catches integration breaks no unit test sees | M |
| 4.4 | **Structured ingest logs** — JSON-lines report alongside the human output, ready for future drains | Cheap now, tedious to retrofit | S |

## Explicitly deferred

- **Schema 3-place unification** (`lib/db/schema.ts` / `SCHEMA_CONTEXT` / `ALLOWED_TABLES`) — the
  engine was just security-hardened through three adversarial rounds; churn there risks more than
  the duplication costs. The invariant is documented in ADR-0001 and machine-checked by M1.5.
- **Full OTel/tracing, log drains, DocSearch dedup** — post-users.
