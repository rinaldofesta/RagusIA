// NL→SQL safety tests — validator + read-only execution. No LLM required
// (deterministic, keyless). Requires the seeded local DB (fact tables).
import { expect, test } from "vitest";
import { extractSql, isSafeSelect, ensureLimit, execReadOnly, referencesOnlyAllowedTables } from "@/lib/query/engine";
import { sql } from "@/lib/db/client";

test("extractSql strips markdown fences and prose", () => {
  expect(extractSql("```sql\nSELECT 1\n```")).toBe("SELECT 1");
  expect(extractSql("Ecco la query: select * from fact_budget;")).toBe("select * from fact_budget");
});

test("isSafeSelect accepts single SELECT / WITH", () => {
  expect(isSafeSelect("select * from fact_budget")).toBe(true);
  expect(isSafeSelect("WITH x AS (select 1) select * from x")).toBe(true);
});

test("isSafeSelect rejects writes, DDL, multi-statement, and SET", () => {
  for (const bad of [
    "insert into fact_budget values ('x')",
    "update fact_budget set importo = 0",
    "delete from fact_budget",
    "drop table fact_budget",
    "truncate fact_budget",
    "select 1; drop table fact_budget",
    "set statement_timeout = 0",
    "select 1; select 2",
  ]) {
    expect(isSafeSelect(bad), bad).toBe(false);
  }
});

test("referencesOnlyAllowedTables allows fact/entities/sources tables and CTEs", () => {
  for (const ok of [
    "select * from fact_budget",
    "select * from fact_contracts fc join fact_budget fb on fc.ufficio = fb.missione_label",
    "select s.status from sources s",
    "select count(*) from entities",
    "with top as (select * from fact_pnrr order by progetti desc limit 3) select * from top",
    "select 'no_answer' as nota", // constant SELECT, no FROM
    "select extract(year from now()) as y from fact_budget", // FROM as function syntax
    "select substring(oggetto from 1 for 3) from fact_contracts",
    "with top as (select missione_code, progetti from fact_pnrr) select t.missione_code from top t", // CTE aliased
    "select x.a from (select cig as a from fact_contracts) x", // derived-table aliased
    "select u.ufficio, t.importo from (select distinct ufficio from fact_contracts) u cross join lateral (select max(importo) importo from fact_contracts c where c.ufficio = u.ufficio) t limit 50", // LATERAL join
    "select e.id, t.tot from entities e left join lateral (select sum(importo) tot from fact_contracts c where c.ufficio = e.id) t on true limit 50",
    "with recursive months as (select 1 as m union all select m+1 from months where m < 12) select m, count(c.cig) from months left join fact_contracts c on extract(month from c.data) = m group by m order by m", // WITH RECURSIVE
  ]) {
    expect(referencesOnlyAllowedTables(ok), ok).toBe(true);
  }
});

test("referencesOnlyAllowedTables blocks non-allowlisted / system tables", () => {
  for (const bad of [
    "select email, encrypted_password from auth.users",
    "select * from public.auth", // not an allowlisted table
    "select * from pg_catalog.pg_tables",
    "select * from pg_user",
    "select * from information_schema.columns",
    "select current_setting('x')",
    "select * from sources, pg_shadow", // comma-joined catalog table
    "select (select string_agg(rolname, ',') from pg_roles)",
    "select * from storage.objects",
  ]) {
    expect(referencesOnlyAllowedTables(bad), bad).toBe(false);
  }
});

test("referencesOnlyAllowedTables blocks comma-join, quoting, comment and introspection bypasses", () => {
  for (const bad of [
    'select f.cig, u.* from fact_contracts f, "auth"."users" u', // quoted schema qualifier
    "select f.cig, u.* from fact_contracts f, auth.users u", // comma cross-join
    "select * from sources, pgsodium.key", // schema not in any static blocklist
    "select * from sources, pgbouncer.get_auth",
    "select * from sources, secretstuff", // unqualified non-allowlisted comma table
    "select * from fact_budget, vault.secrets",
    "select/**/*/**/from/**/auth.users", // comment-obfuscated
    "select current_role",
    "select user, current_catalog, current_schema, version()",
    "select * from fact_budget auth, auth.users", // alias-shadowing attempt
    "select trim(both from (select email from auth.users limit 1)) as x from fact_contracts", // FROM inside function → nested subquery
    "select substring((select email from auth.users limit 1) from 1 for 5) as x from fact_contracts",
    "select position('a' in (select email from auth.users limit 1)) as x from fact_contracts",
    "select overlay((select decrypted_secret from vault.decrypted_secrets limit 1) placing 'x' from 1 for 0) as x from fact_contracts",
    "select * from fact_contracts join entities on true, auth.users", // comma table after a JOIN...ON
    "select * from fact_contracts f left join entities e on e.id = f.cig, storage.objects",
    "select * from fact_budget b join entities e on true, fact_contracts c, auth.users u",
  ]) {
    expect(referencesOnlyAllowedTables(bad), bad).toBe(false);
  }
});

test("referencesOnlyAllowedTables still allows aliased comma-joins of allowed tables", () => {
  for (const ok of [
    "select fc.cig, e.name from fact_contracts fc, entities e where fc.ufficio = e.name",
    "select s.status from sources as s",
  ]) {
    expect(referencesOnlyAllowedTables(ok), ok).toBe(true);
  }
});

test("ensureLimit appends only when absent", () => {
  expect(ensureLimit("select 1")).toContain("limit 200");
  expect(ensureLimit("select 1 limit 5")).toBe("select 1 limit 5");
});

test("execReadOnly runs a SELECT against the seeded fact tables", async () => {
  const rows = await execReadOnly("select missione_code, importo from fact_budget order by importo desc limit 3");
  expect(rows.length).toBeGreaterThan(0);
  expect(rows[0]).toHaveProperty("missione_code");
});

test("execReadOnly refuses to write (read-only transaction)", async () => {
  await expect(
    execReadOnly("insert into fact_budget (id, missione_code, missione_label, importo, anno) values ('h','M99','x',1,2024)"),
  ).rejects.toThrow();
});

test("execReadOnly runs as the least-privilege role, blocking foreign schemas when the role is assumable (migration 0002)", async () => {
  // Guard on the REAL capability, not pg_has_role('MEMBER'): under Supabase the
  // app's `postgres` role holds ADMIN on query_reader yet cannot SET ROLE into
  // it, so the DB boundary is inert and the allowlist is what guards queries.
  const canSetRole = await sql
    .begin(async (tx) => {
      await tx.unsafe("set local role query_reader");
    })
    .then(() => true)
    .catch(() => false);
  if (!canSetRole) return; // role not assumable here — the app-layer allowlist is the boundary
  // Bypasses the parser on purpose: even a raw foreign-table read must be denied by the DB.
  await expect(execReadOnly("select 1 from auth.users")).rejects.toThrow();
});

test("Data API roles (anon/authenticated) are locked out of public tables (migration 0003)", async () => {
  // Migration 0003 enables RLS + revokes grants, so the Supabase Data API roles
  // — reachable with the public anon key — can neither read nor write civic data.
  // Runs as the app owner (postgres), which SET ROLEs into these built-in roles.
  for (const role of ["anon", "authenticated"]) {
    await expect(
      sql.begin(async (tx) => {
        await tx.unsafe(`set local role ${role}`);
        await tx.unsafe("select 1 from fact_budget limit 1");
      }),
      role,
    ).rejects.toThrow();
  }
});
