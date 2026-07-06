// Integration test against the seeded local Supabase Postgres.
// Requires: `supabase start` + `pnpm seed` beforehand. Run with `pnpm test`
// (DATABASE_URL is loaded from the shell env / .env via dotenv when seeding).
import { expect, test } from "vitest";
import * as repo from "@/lib/data/repository";

test("getSourceHealth: 12-source registry, ok+warn accounted, atRisk matches warn", async () => {
  // Invariant across seed/live: 12 registry sources; ok+warn = 12; atRisk lists the warn ones.
  const h = await repo.getSourceHealth();
  expect(h.total).toBe(12);
  expect(h.ok + h.warn).toBe(12);
  expect(h.atRisk).toHaveLength(h.warn);
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

test("getBilancio: 12+ missioni, sorted with the top bar at pct 100", async () => {
  // Invariant across seed/live: the largest mission has pct 100 and a valid ARCONET code.
  const b = await repo.getBilancio();
  expect(b.missioni.length).toBeGreaterThanOrEqual(12);
  expect(b.missioni[0].pct).toBe(100);
  expect(b.missioni[0].code).toMatch(/^M\d/);
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
  expect(await repo.routeQuestion("Chi compone la giunta?")).toEqual({ kind: "qa", id: "giunta", analytic: false });
  expect(await repo.routeQuestion("Dove faccio la carta d'identità?")).toEqual({ kind: "service", id: "svc-cie", analytic: false });
  expect((await repo.routeQuestion("colore preferito del gatto?")).kind).toBe("nomatch");
});

test("getOperatore: returns the { meta, contratti } shape", async () => {
  // Post-ANAC-live the appalti panel holds tipologia (no per-operatore winners),
  // so this asserts the shape rather than seed-specific values.
  const op = await repo.getOperatore("op-iblea");
  expect(op).toHaveProperty("meta");
  expect(Array.isArray(op.contratti)).toBe(true);
});
