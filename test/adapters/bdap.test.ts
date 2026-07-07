// BDAP adapter parse tests. The fragile parts are the number parsing (Italian vs
// US formats), the competenza-column selection, and the ARCONET code padding.
// Fixture columns per design/phase2-research/bdap.md (harmonized `;`-CSV).
import { expect, test } from "vitest";
import {
  parseEuro,
  pad2,
  amountCell,
  byHeader,
  parseBdapMissioni,
  parseBdapTitoli,
} from "@/lib/data/adapters/sources/bdap";

test("parseEuro handles Italian, US, symboled and empty amounts", () => {
  expect(parseEuro("1.234.567,89")).toBeCloseTo(1234567.89); // Italian
  expect(parseEuro("1,234,567.89")).toBeCloseTo(1234567.89); // US
  expect(parseEuro("€ 89.600.000,00")).toBeCloseTo(89600000); // symbol + IT
  expect(parseEuro("500")).toBe(500);
  expect(parseEuro("")).toBe(0);
  expect(parseEuro("n/d")).toBe(0);
});

test("pad2 extracts and 2-pads an ARCONET code", () => {
  expect(pad2("M12")).toBe("12");
  expect(pad2("1")).toBe("01");
  expect(pad2("M01")).toBe("01");
  expect(pad2("")).toBe("");
});

test("byHeader matches a header by case-insensitive substring", () => {
  const row = { "Denominazione Soggetto": "COMUNE DI RAGUSA", "Codice Missione": "12" };
  expect(byHeader(row, "denominazione soggetto")).toBe("COMUNE DI RAGUSA");
  expect(byHeader(row, "nonexistent")).toBe("");
});

test("amountCell picks the competenza year-1 column, not FPV/di-cui", () => {
  const row = {
    "Previsioni in CC 1 Anno": "1.000,00",
    "di cui FPV in CC 1 Anno": "50,00",
    "Impegnato CC 1 Anno": "900,00",
  };
  expect(amountCell(row)).toBe("1.000,00");
});

const MISSIONI_CSV = `Denominazione Soggetto;Codice Missione;Previsioni in CC 1 Anno;di cui FPV in CC 1 Anno
COMUNE DI RAGUSA;1;12.000.000,00;100,00
COMUNE DI RAGUSA;12;8.500.000,50;0,00
COMUNE DI VITTORIA;1;9.000.000,00;0,00`;

test("parseBdapMissioni filters to the soggetto and maps code/amount", () => {
  const out = parseBdapMissioni(MISSIONI_CSV, "COMUNE DI RAGUSA");
  expect(out).toEqual([
    { code: "01", amount: 12000000 },
    { code: "12", amount: 8500000.5 },
  ]);
});

const QUADRO_CSV = `Denominazione Soggetto;Codice Titolo;Previsioni in CC 1 Anno
COMUNE DI RAGUSA;1;89.600.000,00
COMUNE DI RAGUSA;2;68.700.000,00`;

test("parseBdapTitoli splits Titolo I (corrente) / II (capitale)", () => {
  expect(parseBdapTitoli(QUADRO_CSV, "COMUNE DI RAGUSA")).toEqual({
    corrente: 89600000,
    capitale: 68700000,
  });
});
