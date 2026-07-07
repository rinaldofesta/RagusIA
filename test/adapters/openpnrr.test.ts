// OpenPNRR adapter parse test. The load-bearing rule (openpnrr.md): financing is
// summed over SINGLE-comune projects only — multi-territorio projects carry
// national totals that inflate the figure ~12×.
import { expect, test } from "vitest";
import { sumSingleComuneFinancing, type Progetto } from "@/lib/data/adapters/sources/openpnrr";

const RESULTS: Progetto[] = [
  { territori: ["ragusa"], finanziamento_totale: "1000.50" },
  { territori: ["ragusa", "modica"], finanziamento_totale: "999999" }, // multi-comune → excluded
  { territori: ["ragusa"], finanziamento_totale: null }, // null → 0
  { territori: ["ragusa"], finanziamento_totale: "500" },
];

test("sumSingleComuneFinancing sums only single-territorio projects", () => {
  expect(sumSingleComuneFinancing(RESULTS)).toBeCloseTo(1500.5);
});

test("sumSingleComuneFinancing handles an empty list", () => {
  expect(sumSingleComuneFinancing([])).toBe(0);
});
