// Pure-data assertions on the seed modules (no DB).
import { expect, test } from "vitest";
import {
  sources, entities, docs, services, dominiCards, graphTypes, mapMarkers, qaMeta,
} from "@/lib/data/seed";

test("sources: 15 entries, ANAC at risk", () => {
  expect(Object.keys(sources)).toHaveLength(15);
  expect(sources.anac.status).toBe("warn");
  expect(sources.istat.status).toBe("ok");
});

test("entities: sindaco maps to dait + eligendo", () => {
  expect(Object.keys(entities).length).toBeGreaterThanOrEqual(18);
  expect(entities["sindaco-cassi"].sources).toEqual(["dait", "eligendo"]);
});

test("collections have expected sizes", () => {
  expect(docs).toHaveLength(12);
  expect(Object.keys(services)).toHaveLength(6);
  expect(dominiCards).toHaveLength(8);
  expect(graphTypes).toHaveLength(18);
  expect(mapMarkers).toHaveLength(14);
});

test("qaMeta carries body + sql for each curated answer", () => {
  for (const id of ["giunta", "bilancio", "appalti", "pnrr", "demografia"]) {
    expect(qaMeta[id].body).toBe(id);
    expect(qaMeta[id].sql.length).toBeGreaterThan(0);
  }
});
