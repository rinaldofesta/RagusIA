// Canonical Italian number/currency/percent/date formatters. Pure and
// dependency-free, so it's importable by BOTH the app runtime (server/client
// components) and the ingest/seed tsx scripts. Parsers (string→number) live with
// their callers, not here — note lib/data/facts.ts has an unrelated `euroMln`
// that PARSES "€29,8M"→number; do not confuse it with the formatter below.

/** One-decimal Italian number: 89.14 → "89,1". */
export const itDec1 = (n: number): string => n.toFixed(1).replace(".", ",");

/** Italian thousands separator: 73878 → "73.878". */
export const itNum = (n: number): string => Math.round(n).toLocaleString("it-IT");

/** One-decimal Italian percentage WITH sign: 9.64 → "9,6%". */
export const itPct = (p: number): string => `${itDec1(p)}%`;

/** Integer percentage of part/whole, no sign: pctInt(93,118) → 79. */
export const pctInt = (part: number, whole: number): number =>
  whole ? Math.round((part / whole) * 100) : 0;

/** Euro, thousands-separated, no decimals: 480000 → "€480.000". */
export const euro = (n: number): string => `€${itNum(n)}`;

/** BARE one-decimal millions from euros: 89102287 → "89,1".
 *  Callers wrap it, e.g. `€${mln(x)}M` or `€${mln(x)} mln`. */
export const mln = (euros: number): string => itDec1(euros / 1_000_000);

/** TIERED euro from euros: 44_100_000 → "€44,1M", 45_000 → "€45k", 900 → "€900".
 *  Intentionally different from `mln` — do not collapse the two. */
export const euroMln = (n: number): string => {
  if (n >= 1_000_000) return `€${itDec1(n / 1_000_000)}M`;
  if (n >= 1_000) return `€${(n / 1_000).toFixed(0)}k`;
  return `€${Math.round(n)}`;
};

/** ISO "yyyy-mm-…" → "mm/yyyy" (empty-safe passthrough). */
export const fmtMonth = (iso: string): string => {
  const m = /^(\d{4})-(\d{2})/.exec(iso || "");
  return m ? `${m[2]}/${m[1]}` : iso || "";
};

const pad = (n: number): string => String(n).padStart(2, "0");
/** Date → "dd/mm/yyyy". */
export const fmtDate = (d: Date): string =>
  `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
/** Date → "dd/mm/yyyy hh:mm". */
export const fmtRefresh = (d: Date): string =>
  `${fmtDate(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
