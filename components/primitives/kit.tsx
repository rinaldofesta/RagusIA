import Link from "next/link";
import type { ReactNode } from "react";
import { SourceChip, type ProvDotKind } from "./provenance";

export type ChipProps = { sourceId: string; what?: string; dot?: ProvDotKind; tag: string };

/** Phosphor icon. weight: regular | duotone | thin | fill | bold. */
export function Icon({
  name,
  weight = "regular",
  className,
  style,
}: {
  name: string;
  weight?: "regular" | "duotone" | "thin" | "fill" | "bold";
  className?: string;
  style?: React.CSSProperties;
}) {
  const prefix = weight === "regular" ? "ph" : `ph-${weight}`;
  return <i className={`${prefix} ${name} ${className ?? ""}`} style={style} aria-hidden />;
}

/** Generic card surface (design: bg-card-2 / border-line / rounded-14). */
export function SectionCard({
  children,
  className = "",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={`bg-card-2 border border-line rounded-[14px] ${padded ? "p-[19px_20px]" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

/** KPI card with optional provenance chip (design lines 343-354). */
export function KpiCard({
  label,
  value,
  sub,
  chip,
}: {
  label: string;
  value: string;
  sub?: string;
  chip?: ChipProps;
}) {
  return (
    <div className="bg-card-2 border border-line rounded-[13px] px-4 py-[15px] flex flex-col">
      <div className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-3 mb-[9px]">
        {label}
      </div>
      <div className="font-spectral text-[26px] leading-none font-medium text-ink tracking-[-0.01em]">
        {value}
      </div>
      {sub ? <div className="font-hanken text-[11.5px] font-medium text-ink-2 mt-[5px]">{sub}</div> : null}
      {chip ? (
        <div className="mt-3 self-start">
          <SourceChip sourceId={chip.sourceId} what={chip.what} dot={chip.dot} tag={chip.tag} />
        </div>
      ) : null}
    </div>
  );
}

/** Labelled progress bar; clickable to an entity when `entityId` is given
 *  (design lines 360-368 / 441-449). */
export function BarRow({
  label,
  value,
  pct,
  color,
  code,
  entityId,
}: {
  label: string;
  value: string;
  pct: number;
  color: string;
  code?: string;
  entityId?: string;
}) {
  const inner = (
    <>
      <div className="flex items-baseline justify-between gap-3 mb-[5px]">
        <span className="font-hanken text-[12px] font-medium text-ink">
          {code ? (
            <span className="font-mono text-[9.5px] font-semibold text-ink-3 mr-2">{code}</span>
          ) : null}
          {label}
        </span>
        <span className="font-mono text-[12px] font-semibold text-ink flex-none">{value}</span>
      </div>
      <div className="h-[7px] rounded-[4px] bg-sand overflow-hidden">
        <div className="h-full rounded-[4px]" style={{ width: `${pct}%`, background: color }} />
      </div>
    </>
  );
  if (entityId) {
    return (
      <Link
        href={`/entita/${entityId}`}
        className="block w-full text-left -mx-[6px] px-[6px] py-[6px] rounded-[7px] hover:bg-[rgba(28,26,23,0.028)] transition-colors"
      >
        {inner}
      </Link>
    );
  }
  return <div className="py-[7px]">{inner}</div>;
}

/** Breadcrumb "Domini › X" (design lines 335 etc.). */
export function Breadcrumb({ trail }: { trail: { label: string; href?: string }[] }) {
  return (
    <div className="flex items-center gap-[7px] font-hanken text-[12px] font-medium text-ink-3 mb-[18px]">
      {trail.map((c, i) => (
        <span key={i} className="flex items-center gap-[7px]">
          {c.href ? (
            <Link href={c.href} className="text-ink-3 hover:text-amber-d transition-colors">
              {c.label}
            </Link>
          ) : (
            <span className="text-ink-2">{c.label}</span>
          )}
          {i < trail.length - 1 ? <Icon name="ph-caret-right" className="text-[11px]" /> : null}
        </span>
      ))}
    </div>
  );
}

/** Answer prose wrapper (Spectral 17.5/1.72) — design line 160. */
export function AnswerProse({ children }: { children: ReactNode }) {
  return (
    <div className="font-spectral text-[17.5px] leading-[1.72] font-normal text-ink max-w-[700px]">
      {children}
    </div>
  );
}

/** Entity link wrapper. */
export function EntityRef({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={`/entita/${id}`} className={className}>
      {children}
    </Link>
  );
}

/** Suggestion chip (links to a Chiedi query) — design lines 105-116. */
export function SuggestionChip({
  href,
  icon,
  label,
  accent = "amber",
}: {
  href: string;
  icon: string;
  label: string;
  accent?: "amber" | "teal";
}) {
  const hover =
    accent === "teal"
      ? "hover:border-teal hover:bg-[rgba(42,102,168,0.06)] hover:text-ink"
      : "hover:border-amber hover:bg-amber-tint hover:text-ink";
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-[7px] bg-card border border-line rounded-full px-[13px] py-[7px] font-hanken text-[12.5px] font-medium text-ink-2 cursor-pointer transition-colors ${hover}`}
    >
      <Icon
        name={icon}
        className="text-[14px]"
        style={{ color: accent === "teal" ? "var(--teal)" : "var(--amber-d)" }}
      />
      {label}
    </Link>
  );
}
