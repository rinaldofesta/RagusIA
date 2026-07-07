-- Least-privilege role for the NL→SQL engine (lib/query/engine.ts).
--
-- The read-only transaction in execReadOnly does `SET LOCAL ROLE query_reader`
-- before running model-generated SQL. So even if the app-layer table allowlist
-- (referencesOnlyAllowedTables) is ever bypassed, the query executes with SELECT
-- on ONLY the six query-substrate tables — it physically cannot read Supabase
-- `auth`/`storage`/`vault` or any other schema. This is the durable boundary
-- that does NOT depend on a regex.
--
-- Note: pg_catalog / information_schema stay readable by PUBLIC as in stock
-- Postgres; the app-layer BLOCKED_TOKEN guard (pg_*, current_*, version, …)
-- covers catalog introspection. The role closes the high-value gap (auth/vault).
--
-- The DO blocks use a NAMED dollar-quote tag ($do$), not bare $$: the Supabase
-- CLI migration splitter doesn't treat bare $$ as a quote boundary and splits on
-- the `;` inside the block ("unexpected EOF" on `supabase db reset`/`start`).

do $do$
begin
  if not exists (select 1 from pg_roles where rolname = 'query_reader') then
    create role query_reader nologin;
  end if;
end
$do$;

-- SELECT on exactly the six tables the engine is allowed to read; nothing else.
revoke all on all tables in schema public from query_reader;
grant usage on schema public to query_reader;
grant select on
  fact_contracts, fact_budget, fact_pnrr, fact_coesione, entities, sources
  to query_reader;

-- Let the application role drop into query_reader for the read-only tx. PG16+
-- requires WITH SET TRUE for SET ROLE; earlier versions grant SET by default.
do $do$
begin
  if current_setting('server_version_num')::int >= 160000 then
    execute 'grant query_reader to current_user with set true';
  else
    execute 'grant query_reader to current_user';
  end if;
end
$do$;
