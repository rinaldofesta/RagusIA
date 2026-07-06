// Provenance helpers shared by the curated answer bodies. They turn a live
// `Source` (its real health) into the inline `<Cite>` dot + tag, so the prose
// never claims "ok" for a source that failed its last refresh, and read a
// live KPI value by label. This is what keeps the curated answers honest and
// drift-free: the figures and their provenance come from the same model the
// dashboards read.

import type { Kpi, Source } from "@/lib/model/types";
import type { ProvDotKind } from "@/components/primitives/provenance";

/** Dot color: outlined amber for estimates, filled amber for an at-risk source,
 *  teal otherwise. Accepts anything carrying a `status` (Source, DomainCard, Kpi). */
export function srcDot(src: { status?: Source["status"] } | null | undefined, est = false): ProvDotKind {
  if (est) return "est";
  return src?.status === "warn" ? "warn" : "ok";
}

/** Live provenance tag: "ANAC · CC-BY 4.0" when ok, "ANAC · a rischio" when the last refresh failed. */
export function srcTag(src: Source | null | undefined, okSuffix: string): string {
  if (!src) return okSuffix;
  return src.status === "warn" ? `${src.short} · a rischio` : `${src.short} · ${okSuffix}`;
}

/** Read a KPI value by exact label, falling back to a prefix match (e.g. "Stima 2026"). */
export function kpiValue(kpis: Kpi[], label: string): string {
  const k = kpis.find((x) => x.label === label) ?? kpis.find((x) => x.label.startsWith(label));
  return k?.value ?? "—";
}

/** Read a KPI's sub-caption the same way (e.g. the "investimenti · ≈ 43%" under Conto capitale). */
export function kpiSub(kpis: Kpi[], label: string): string {
  const k = kpis.find((x) => x.label === label) ?? kpis.find((x) => x.label.startsWith(label));
  return k?.sub ?? "";
}
