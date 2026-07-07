# ADR-0001: NL→SQL layered defense; the `query_reader` role is the durable boundary

- **Date:** 2026-07-01 (hardened 2026-07-06) · **Status:** Accepted

## Context

The Chiedi surface lets an LLM generate SQL from an untrusted natural-language question and
executes it against the app database (`lib/query/engine.ts`). LLM output must be treated as
attacker-controlled: three adversarial review rounds each found new validator bypasses
(comma-joins, quoted qualifiers, nested subqueries inside function-syntax `FROM`, JOIN-then-comma,
dollar-quoted strings). Regex/parser validation of SQL is inherently an arms race.

## Decision

Generated SQL passes through **independent layers**, each sufficient to stop a class of attack:

1. **Single-SELECT validator** (`isSafeSelect`) — one statement, no writes/DDL/SET.
2. **Table allowlist via FROM-clause parsing** (`referencesOnlyAllowedTables`) — every table
   reference must be one of `fact_contracts`, `fact_budget`, `fact_pnrr`, `fact_coesione`,
   `entities`, `sources`, or a CTE. Backed by quoted-identifier rejection, comment/string/
   dollar-quote stripping, function-keyword neutralization, and blocked catalog tokens
   (`pg_*`, `current_*`, `version`, file functions).
3. **Execution constraints** (`execReadOnly`) — `READ ONLY` transaction, `statement_timeout=4000`,
   200-row cap.
4. **Least-privilege DB role** — `SET LOCAL ROLE query_reader`
   (`supabase/migrations/0002_query_reader_role.sql`): a `NOLOGIN` role with `SELECT` on exactly
   the six allowlisted tables and nothing else. When the app can assume it, this is a **durable**
   backstop that holds even if every code-level layer is bypassed.

The role is probed at runtime by **attempting the real `SET LOCAL ROLE`** (not `pg_has_role`,
which is a false positive — see below); the engine degrades gracefully to app-role + allowlist
whenever it can't assume the role.

**Known limitation (Supabase `postgres`).** The role's DB-level enforcement is **inert** when the
app connects as Supabase's `postgres` role. `postgres` is a reserved role that `supautils`
protects (any `GRANT … TO postgres` closes the connection), and it is not a superuser, so it
cannot `SET ROLE query_reader`. `pg_has_role(postgres, 'query_reader', 'MEMBER')` even returns
true — `postgres` holds ADMIN on the role because it created it — while `SET ROLE` is still
denied (PG16 separates membership from the SET privilege). So under the current connection the
NL→SQL boundary is the hardened **app-layer allowlist + read-only transaction**, and the role is
least-privilege scaffolding. To make the DB backstop *active*, connect as a dedicated LOGIN role
granted `query_reader WITH SET TRUE` (a deploy-time change tracked in `docs/ROADMAP.md`).

## Consequences

- When the role is assumable, `auth.users`, `storage.objects`, `vault.*`, and every
  non-allowlisted table are denied at the **database** layer, independent of code correctness
  (the `test/query.test.ts` DB-boundary test asserts this, and skips when the role can't be
  assumed — e.g. under Supabase `postgres`, per the limitation above).
- **Invariant — 3-place schema sync:** the fact-table shape is deliberately duplicated in
  `lib/db/schema.ts` (Drizzle), `lib/query/schema-context.ts` (LLM prompt), and
  `ALLOWED_TABLES`/`FACT_SOURCES` in `lib/query/engine.ts`. Adding or renaming a fact table means
  updating all three **and** migration 0002's grants. Unification was considered and deferred:
  the engine was just security-hardened and churn there is riskier than the duplication
  (a machine-check test is planned — see `docs/ROADMAP.md` M1).
- **Invariant — future RLS must include `query_reader`:** the role does not bypass row-level
  security. Any RLS rollout must ship explicit `FOR SELECT TO query_reader USING (true)` policies
  on the six tables, or the NL→SQL path silently breaks (see `docs/ROADMAP.md` M2).
- Activating the DB backstop requires the app role to be granted `query_reader WITH SET TRUE`
  (PG16+). Migration 0002 does **not** grant it to `postgres` (that grant is rejected by Supabase
  and can never succeed); a dedicated LOGIN app role is the way to turn the backstop on.
- Bypass payloads that were found and closed are locked in as tests in `test/query.test.ts`;
  new bypasses should be added there before being fixed.
