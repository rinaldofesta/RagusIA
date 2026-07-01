// NL→SQL safety tests — validator + read-only execution. No LLM required
// (deterministic, keyless). Requires the seeded local DB (fact tables).
import { expect, test } from "vitest";
import { extractSql, isSafeSelect, ensureLimit, execReadOnly } from "@/lib/query/engine";

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
