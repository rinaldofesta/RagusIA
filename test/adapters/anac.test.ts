// ANAC adapter parse tests. Fixture is a representative `;`-CSV modelled on the
// national `cig_csv` monthly export (columns per design/phase2-research/anac.md).
import { expect, test } from "vitest";
import { parseAnacContracts, titleCase } from "@/lib/data/adapters/sources/anac";

const CF_RAGUSA = "00180270886";

// Two Ragusa rows (one using the `_gara` fallback columns) + one other comune.
const CSV = `cf_amministrazione_appaltante;cig;oggetto_lotto;oggetto_gara;importo_lotto;importo_complessivo_gara;oggetto_principale_contratto;denominazione_centro_costo;data_pubblicazione
00180270886;A1B2C3;Manutenzione strade comunali;;150000.50;;LAVORI;SETTORE VII;2024-03-15
00180270886;D4E5F6;;Fornitura arredi scolastici;;42000;FORNITURE;;2024-06-01
99999999999;X0Y0Z0;Appalto di un altro comune;;500000;;SERVIZI;ALTRO ENTE;2024-02-02`;

test("parseAnacContracts keeps only rows for the given CF", () => {
  const out = parseAnacContracts(CSV, CF_RAGUSA);
  expect(out.map((c) => c.cig)).toEqual(["A1B2C3", "D4E5F6"]);
});

test("parseAnacContracts normalizes fields with the documented fallbacks", () => {
  const [a, b] = parseAnacContracts(CSV, CF_RAGUSA);
  expect(a).toEqual({
    cig: "A1B2C3",
    oggetto: "Manutenzione strade comunali",
    importo: 150000.5,
    tipologia: "LAVORI",
    ufficio: "SETTORE VII",
    data: "2024-03-15",
  });
  // Second row exercises the `_gara` oggetto fallback, the importo_complessivo
  // fallback, and the "—" default for a missing centro di costo.
  expect(b.oggetto).toBe("Fornitura arredi scolastici");
  expect(b.importo).toBe(42000);
  expect(b.ufficio).toBe("—");
});

test("parseAnacContracts returns [] for an unknown CF", () => {
  expect(parseAnacContracts(CSV, "00000000000")).toEqual([]);
});

test("titleCase lowercases all but the first letter (ALTRO tipologia labels)", () => {
  expect(titleCase("LAVORI")).toBe("Lavori");
  expect(titleCase("")).toBe("");
});
