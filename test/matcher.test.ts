import { expect, test } from "vitest";
import { matchQA, docTokens } from "@/lib/search/matcher";

test.each([
  ["Dove faccio la carta d'identità?", "svc-cie"],
  ["Chi compone la giunta Cassì?", "giunta"],
  ["Quanto vale il bilancio 2024 per missione?", "bilancio"],
  ["chi ha vinto più appalti sopra i 40k?", "appalti"],
  ["quanti progetti pnrr sono attivi?", "pnrr"],
  ["quanti residenti e stranieri?", "demografia"],
  ["come pago la tari?", "svc-tari"],
  // NOTE: the design regex for 'giunta' is /giunt|cass|sindac|assessor|consigl/
  // (Ragusia.dc.html line 1570), which matches the substring "sindac" in
  // "sindaco". A verbatim port therefore classifies this as 'giunta', not
  // 'nomatch'. Using a query with no matching substrings to exercise the
  // true fallback case instead.
  ["qual è il colore preferito del gatto?", "nomatch"],
])("matchQA(%s)=%s", (q, e) => expect(matchQA(q as string)).toBe(e));

test("docTokens strips stopwords + truncates to 5", () => {
  expect(docTokens("trovami le delibere di giunta")).toEqual(["delib", "giunt"]);
});
