// OpenCoesione adapter parse tests. Shape per design/phase2-research/opencoesione.md
// (pre-aggregated `aggregati/territori` payload).
import { expect, test } from "vitest";
import { toInt, parseCoesione, type AggregatiResponse } from "@/lib/data/adapters/sources/opencoesione";

test("toInt parses Italian decimal strings to a rounded integer", () => {
  expect(toInt("89102287,00")).toBe(89102287);
  expect(toInt("116")).toBe(116);
  expect(toInt("12,6")).toBe(13);
  expect(toInt(undefined)).toBe(0);
});

const MSG: AggregatiResponse = {
  aggregati: {
    totali: { progetti: "116", costo_pubblico: "89102287,00" },
    stati_progetti: {
      non_avviato: { totali: { progetti: "10" } },
      in_corso: { totali: { progetti: "40" } },
      liquidato: { totali: { progetti: "30" } },
      concluso: { totali: { progetti: "36" } },
    },
  },
};

test("parseCoesione normalizes totals + status breakdown", () => {
  expect(parseCoesione(MSG)).toEqual({
    interventi: 116,
    valoreEuro: 89102287,
    status: { non_avviato: 10, in_corso: 40, liquidato: 30, concluso: 36 },
  });
});

test("parseCoesione returns null when the payload is empty or has 0 interventi", () => {
  expect(parseCoesione({} as AggregatiResponse)).toBeNull();
  expect(
    parseCoesione({
      aggregati: { totali: { progetti: "0", costo_pubblico: "0" }, stati_progetti: {} },
    }),
  ).toBeNull();
});
