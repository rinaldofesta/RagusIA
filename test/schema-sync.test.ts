// Guards the deliberate 3-place fact-table duplication (ADR-0001): the Drizzle
// schema, the engine's allowlist, and the LLM prompt must describe the same
// tables. Full unification is deferred; this test is the cheap machine-check that
// makes drift fail loudly instead of silently weakening or breaking the engine.
import { expect, test } from "vitest";
import { getTableName } from "drizzle-orm";
import {
  factContracts,
  factBudget,
  factPnrr,
  factCoesione,
  entities,
  sources,
} from "@/lib/db/schema";
import { ALLOWED_TABLES, FACT_SOURCES } from "@/lib/query/engine";
import { SCHEMA_CONTEXT } from "@/lib/query/schema-context";

// The real Postgres table names the engine is allowed to touch.
const allowlistedTables = [factContracts, factBudget, factPnrr, factCoesione, entities, sources];
const factTables = [factContracts, factBudget, factPnrr, factCoesione];

test("ALLOWED_TABLES matches the Drizzle schema table names exactly", () => {
  const actual = new Set(allowlistedTables.map(getTableName));
  expect(new Set(ALLOWED_TABLES)).toEqual(actual);
});

test("FACT_SOURCES keys are real fact tables mapping to a non-empty source id", () => {
  const factNames = new Set<string>(factTables.map(getTableName));
  expect(new Set(Object.keys(FACT_SOURCES))).toEqual(factNames);
  for (const [table, sourceId] of Object.entries(FACT_SOURCES)) {
    expect(factNames.has(table), table).toBe(true);
    expect(sourceId.length, `${table} → source id`).toBeGreaterThan(0);
  }
});

test("SCHEMA_CONTEXT (the LLM prompt) mentions every allowlisted table", () => {
  for (const table of allowlistedTables.map(getTableName)) {
    expect(SCHEMA_CONTEXT, table).toContain(table);
  }
});
