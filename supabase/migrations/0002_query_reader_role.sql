-- Least-privilege role for the NL->SQL engine (lib/query/engine.ts).
--
-- execReadOnly does SET LOCAL ROLE query_reader before running model-generated
-- SQL, so that even if the app-layer table allowlist (referencesOnlyAllowedTables)
-- is bypassed, the query can read ONLY the six query-substrate tables -- not
-- Supabase auth/storage/vault or any other schema. This is a defense-in-depth
-- backstop behind the app-layer allowlist + read-only transaction.
--
-- IMPORTANT (Supabase): this role only becomes ACTIVE when the app connects as a
-- role that can SET ROLE into it. Supabase's `postgres` role is reserved and
-- cannot be granted membership (supautils rejects `GRANT ... TO postgres`), and
-- it is not a superuser, so it cannot SET ROLE here -- the engine then degrades
-- to the app-layer allowlist (see queryRoleAvailable, ADR-0001). To activate the
-- DB boundary in production, connect as a dedicated LOGIN role granted
-- `query_reader WITH SET TRUE`. We therefore do NOT grant membership here (doing
-- so to `postgres` closes the connection); we only create the role + table grants.
--
-- One idempotent DO block + plain grants (no membership grant): this is what the
-- Supabase CLI migration applier accepts, so `supabase db reset` / `supabase
-- start` and CI apply it cleanly.

do $do$
begin
  if not exists (select from pg_roles where rolname = 'query_reader') then
    create role query_reader nologin;
  end if;
end
$do$;

-- SELECT on exactly the six query-substrate tables; nothing else.
grant usage on schema public to query_reader;
grant select on
  fact_contracts, fact_budget, fact_pnrr, fact_coesione, entities, sources
  to query_reader;
