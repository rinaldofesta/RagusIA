-- Lock the public schema against the Supabase Data API (PostgREST / GraphQL).
--
-- This app never uses the Data API -- surfaces read through a direct Postgres
-- connection as the table owner (postgres), which BYPASSES RLS, so the app's
-- reads/writes, the seed, and ingestion are all unaffected. But Supabase grants
-- the Data API roles `anon` and `authenticated` full CRUD (incl. TRUNCATE) on
-- every public table by default. With RLS off, anyone holding the *public* anon
-- key could read AND destroy civic data over REST/GraphQL. Enabling RLS with no
-- policy for those roles denies them all row access. `service_role` keeps its
-- BYPASSRLS admin access (secret key, server-side only).
--
-- Idempotent: `enable row level security` is a no-op if already on, and each
-- policy is dropped-then-created. A DO block loop covers every current public
-- table (the Supabase CLI applier handles DO blocks; only role-membership grants
-- to the reserved `postgres` role fail -- see migration 0002).
do $do$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end
$do$;

-- Belt-and-braces: also strip the default CRUD grants Supabase hands the Data
-- API roles, so any access is a hard permission-denied rather than an RLS-filtered
-- 0-row operation. Revoke future grants too (Supabase's default privileges would
-- otherwise re-grant them on new tables). The app owns the tables and is
-- unaffected; service_role keeps its admin grants.
revoke all on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;

-- The six query-substrate tables get a SELECT policy for query_reader so the
-- NL->SQL read path keeps working IF the app is later connected as a role that
-- can SET ROLE into query_reader (roadmap M2.5). query_reader does not bypass
-- RLS, so without these policies it would read nothing. Today the app connects
-- as `postgres` (owner, bypasses RLS), so these are forward-looking scaffolding.
drop policy if exists query_reader_read on fact_contracts;
create policy query_reader_read on fact_contracts for select to query_reader using (true);
drop policy if exists query_reader_read on fact_budget;
create policy query_reader_read on fact_budget for select to query_reader using (true);
drop policy if exists query_reader_read on fact_pnrr;
create policy query_reader_read on fact_pnrr for select to query_reader using (true);
drop policy if exists query_reader_read on fact_coesione;
create policy query_reader_read on fact_coesione for select to query_reader using (true);
drop policy if exists query_reader_read on entities;
create policy query_reader_read on entities for select to query_reader using (true);
drop policy if exists query_reader_read on sources;
create policy query_reader_read on sources for select to query_reader using (true);
