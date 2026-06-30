"use client";

import { useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

/** Opens/closes the global provenance drawer by merging `?fonte=&val=` into the URL. */
export function useProvenance() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const open = useCallback(
    (sourceId: string, what?: string) => {
      const p = new URLSearchParams(params.toString());
      p.set("fonte", sourceId);
      if (what) p.set("val", what);
      else p.delete("val");
      router.push(`${pathname}?${p.toString()}`, { scroll: false });
    },
    [router, pathname, params],
  );

  const close = useCallback(() => {
    const p = new URLSearchParams(params.toString());
    p.delete("fonte");
    p.delete("val");
    const qs = p.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [router, pathname, params]);

  return { open, close };
}

export type ProvDotKind = "ok" | "warn" | "est";

export function ProvDot({ dot, size = 5 }: { dot: ProvDotKind; size?: number }) {
  const cls =
    dot === "est"
      ? "border border-amber bg-transparent"
      : dot === "warn"
        ? "bg-amber"
        : "bg-teal";
  return (
    <span
      className={`rounded-full flex-none ${cls}`}
      style={{ width: size, height: size }}
    />
  );
}

/** Provenance pill (the "BDAP · oss. 2024" chips). */
export function SourceChip({
  sourceId,
  what,
  dot = "ok",
  tag,
}: {
  sourceId: string;
  what?: string;
  dot?: ProvDotKind;
  tag: string;
}) {
  const { open } = useProvenance();
  return (
    <button
      type="button"
      onClick={() => open(sourceId, what)}
      className="inline-flex items-center gap-[5px] py-[2px] pr-2 pl-[7px] rounded-full border border-[rgba(28,26,23,0.13)] bg-[rgba(194,151,42,0.07)] text-[#6B6358] font-mono text-[9.5px] font-medium cursor-pointer transition-colors hover:border-[rgba(194,151,42,0.55)] hover:bg-[rgba(194,151,42,0.13)] hover:text-ink"
    >
      <ProvDot dot={dot} />
      {tag}
    </button>
  );
}

/** Inline citation chip used inside answer prose (slightly larger, baseline-aligned). */
export function Cite({
  sourceId,
  what,
  dot = "ok",
  tag,
}: {
  sourceId: string;
  what?: string;
  dot?: ProvDotKind;
  tag: string;
}) {
  const { open } = useProvenance();
  return (
    <button
      type="button"
      onClick={() => open(sourceId, what)}
      className="inline-flex items-center gap-[5px] mx-px py-[1.5px] pr-[7px] pl-[6px] rounded-full border border-[rgba(28,26,23,0.14)] bg-[rgba(194,151,42,0.07)] text-[#6B6358] font-mono text-[10.5px] leading-[1.45] font-medium cursor-pointer whitespace-nowrap align-[3px] transition-colors hover:border-[rgba(194,151,42,0.55)] hover:bg-[rgba(194,151,42,0.13)] hover:text-ink"
    >
      <ProvDot dot={dot} />
      {tag}
    </button>
  );
}
