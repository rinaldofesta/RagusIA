-- Least-privilege role for the NL->SQL engine (lib/query/engine.ts).
--
-- The read-only transaction in execReadOnly does SET LOCAL ROLE query_reader
-- before running model-generated SQL. So even if the app-layer table allowlist
-- (referencesOnlyAllowedTables) is ever bypassed, the query executes with SELECT
-- on ONLY the six query-substrate tables -- it physically cannot read Supabase
-- auth/storage/vault or any other schema. This is the durable boundary that does
-- NOT depend on a regex.
--
-- Note: pg_catalog / information_schema stay readable by PUBLIC as in stock
-- Postgres; the app-layer BLOCKED_TOKEN guard (pg_*, current_*, version, ...)
-- covers catalog introspection. The role closes the high-value gap (auth/vault).
--
-- Written as plain statements (no DO / dollar-quote blocks): the Supabase CLI
-- migration splitter breaks a DO block on the semicolons inside it, which fails
-- `supabase db reset` / `supabase start` (and CI). Roles are cluster-level and
-- survive a db reset, so drop-then-create keeps repeated resets idempotent.
drop role if exists query_reader;
create role query_reader nologin;

-- SELECT on exactly the six query-substrate tables; nothing else.
grant usage on schema public to query_reader;
grant select on
  fact_contracts, fact_budget, fact_pnrr, fact_coesione, entities, sources
  to query_reader;

-- Let the application role SET ROLE into query_reader for the read-only tx.
-- Role membership defaults to WITH SET TRUE on PG16+ (and PG15 confers SET
-- implicitly), so a plain GRANT works on every supported version. Supabase runs
-- Postgres 17 here.
grant query_reader to current_user;
