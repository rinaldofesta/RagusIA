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
   the six allowlisted tables and nothing else. This is the **durable** boundary — it holds even
   if every code-level layer is bypassed.

The role is probed at runtime (`pg_has_role(..., 'MEMBER')`) and the engine degrades gracefully
to app-role + allowlist where migration 0002 hasn't run (e.g. a fresh local DB).

## Consequences

- `auth.users`, `storage.objects`, `vault.*`, and every non-allowlisted table are denied at the
  **database** layer, independent of code correctness. Verified empirically.
- **Invariant — 3-place schema sync:** the fact-table shape is deliberately duplicated in
  `lib/db/schema.ts` (Drizzle), `lib/query/schema-context.ts` (LLM prompt), and
  `ALLOWED_TABLES`/`FACT_SOURCES` in `lib/query/engine.ts`. Adding or renaming a fact table means
  updating all three **and** migration 0002's grants. Unification was considered and deferred:
  the engine was just security-hardened and churn there is riskier than the duplication
  (a machine-check test is planned — see `docs/ROADMAP.md` M1).
- **Invariant — future RLS must include `query_reader`:** the role does not bypass row-level
  security. Any RLS rollout must ship explicit `FOR SELECT TO query_reader USING (true)` policies
  on the six tables, or the NL→SQL path silently breaks (see `docs/ROADMAP.md` M2).
- PG16+ requires `GRANT query_reader TO <app role> WITH SET TRUE` for `SET ROLE`; the migration
  branches on `server_version_num`.
- Bypass payloads that were found and closed are locked in as tests in `test/query.test.ts`;
  new bypasses should be added there before being fixed.
