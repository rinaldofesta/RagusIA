// Ported verbatim from the prototype (design/reference/Ragusia.dc.html):
// - matchQA: the `matchQA` method, ~lines 1562-1576.
// - docTokens / docMatches: the document-search tokenizer/filter, ~lines 1648-1655.

import type { DocItem } from "@/lib/model/types";

export function matchQA(q: string): string {
  const t = (q || "").toLowerCase();
  if (/carta d.identit|carta identit|\bcie\b|identità elettronic/.test(t))
    return "svc-cie";
  if (/matrimoni|pubblicazion|sposar|nozze/.test(t)) return "svc-matrimonio";
  if (/cambi.*residenz|trasfer.*residenz|nuova residenz|spostare.*residenz/.test(t))
    return "svc-residenza";
  if (/stato di famiglia|certificat|anagraf/.test(t)) return "svc-certificati";
  if (/\btari\b|rifiut|tassa.*rifiut|spazzatur|immondizia/.test(t))
    return "svc-tari";
  if (/asilo|\bnido\b|iscriz|refezion|mensa scolast/.test(t))
    return "svc-scuola";
  if (/giunt|cass|sindac|assessor|consigl/.test(t)) return "giunta";
  if (/bilanci|mission|spes|entrat|capitol/.test(t)) return "bilancio";
  if (/appalt|contratt|40k|40\.000|gara|aggiudicat|operator/.test(t))
    return "appalti";
  if (/pnrr|coesion|progett|finanziam/.test(t)) return "pnrr";
  if (/resident|popolaz|stranier|demograf|abitant|km/.test(t))
    return "demografia";
  return "nomatch";
}

const dStop = new Set([
  "di",
  "del",
  "della",
  "dei",
  "delle",
  "degli",
  "sul",
  "sulla",
  "sui",
  "su",
  "la",
  "il",
  "le",
  "lo",
  "gli",
  "un",
  "una",
  "uno",
  "ed",
  "per",
  "con",
  "che",
  "in",
  "da",
  "al",
  "allo",
  "alla",
  "o",
  "trovami",
  "mostrami",
  "cerca",
  "i",
]);

export function docTokens(q: string): string[] {
  const dq = (q || "").toLowerCase().trim();
  return dq
    ? dq
        .split(/\s+/)
        .filter((t) => t.length >= 3 && !dStop.has(t))
        .map((t) => t.slice(0, 5))
    : [];
}

export function docMatches(doc: DocItem, tokens: string[]): boolean {
  const hay = (
    doc.title +
    " " +
    doc.tipo +
    " " +
    doc.sez +
    " " +
    doc.uff +
    " " +
    doc.n
  ).toLowerCase();
  return tokens.every((t) => hay.includes(t));
}
