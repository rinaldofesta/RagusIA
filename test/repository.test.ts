// Integration test against the seeded local Supabase Postgres.
// Requires: `supabase start` + `pnpm seed` beforehand. Run with `pnpm test`
// (DATABASE_URL is loaded from the shell env / .env via dotenv when seeding).
import { expect, test } from "vitest";
import * as repo from "@/lib/data/repository";

test("getSourceHealth: 12-source registry, ANAC at risk", async () => {
  const h = await repo.getSourceHealth();
  expect(h.total).toBe(12);
  expect(h.warn).toBe(1);
  expect(h.ok).toBe(11);
  expect(h.atRisk).toContain("ANAC");
});

test("getNav returns the six surfaces in order", async () => {
  const nav = await repo.getNav();
  expect(nav.map((n) => n.id)).toEqual([
    "chiedi", "esplora", "domini", "mappa", "documenti", "fonti",
  ]);
});

test("getDominiCards: 8 cards, bilancio+appalti are full", async () => {
  const cards = await repo.getDominiCards();
  expect(cards).toHaveLength(8);
  expect(cards.find((c) => c.slug === "bilancio")?.full).toBe(true);
  expect(cards.find((c) => c.slug === "appalti")?.status).toBe("warn");
});

test("getBilancio: 12 missioni, M01 is the largest bar", async () => {
  const b = await repo.getBilancio();
  expect(b.missioni.length).toBeGreaterThanOrEqual(12);
  expect(b.missioni[0].code).toBe("M01");
  expect(b.missioni[0].pct).toBe(100);
});

test("getGraph: center node centered, links non-empty", async () => {
  const g = await repo.getGraph();
  const center = g.nodes.find((n) => n.tier === "center");
  expect(center?.cx).toBe(680);
  expect(center?.cy).toBe(470);
  expect(g.links.length).toBeGreaterThan(0);
  expect(g.types).toHaveLength(18);
});

test("routeQuestion: deterministic routing (no embeddings)", async () => {
  expect(await repo.routeQuestion("Chi compone la giunta?")).toEqual({ kind: "qa", id: "giunta" });
  expect(await repo.routeQuestion("Dove faccio la carta d'identità?")).toEqual({ kind: "service", id: "svc-cie" });
  expect((await repo.routeQuestion("colore preferito del gatto?")).kind).toBe("nomatch");
});

test("getOperatore: Iblea has contracts", async () => {
  const op = await repo.getOperatore("op-iblea");
  expect(op.meta?.value).toBe("€4,9M");
  expect(op.contratti.length).toBeGreaterThan(0);
});
