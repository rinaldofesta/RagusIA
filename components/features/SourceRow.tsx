"use client";

import { useProvenance } from "@/components/primitives/provenance";
import type { Source } from "@/lib/model/types";

/**
 * Clickable Fonti registry row (design lines 867-881). Opens the provenance
 * drawer for the source on click.
 */
export function SourceRow({ source }: { source: Source }) {
  const { open } = useProvenance();
  const warn = source.status !== "ok";
  const refreshShort = source.refresh.split(" ")[0] ?? source.refresh;

  return (
    <button
      type="button"
      onClick={() => open(source.id, source.what)}
      className="w-full text-left flex items-center gap-3 bg-card-2 border border-line rounded-[12px] px-[18px] py-[14px] cursor-pointer transition-colors hover:border-line-2"
    >
      <span
        className={`w-2 h-2 rounded-full flex-none ${warn ? "bg-amber" : "bg-teal"}`}
      />
      <span className="font-hanken text-[13px] font-semibold text-ink flex-none w-[140px] truncate">
        {source.short}
      </span>
      <span className="flex-1 min-w-0">
        <span className="font-hanken text-[11.5px] font-medium text-ink-2 block truncate">
          {source.full}
        </span>
        <span className="font-hanken text-[11px] leading-[1.4] text-ink-3 block overflow-hidden text-ellipsis whitespace-nowrap">
          {source.what}
        </span>
      </span>
      <span className="flex items-center gap-3 flex-none">
        <span className="font-mono text-[9.5px] font-semibold text-ink bg-sand rounded-[5px] px-[7px] py-[3px]">
          {source.license}
        </span>
        <span className="font-mono text-[11px] font-medium text-ink-3">{source.format}</span>
        <span className="font-mono text-[11px] font-medium text-ink-3">{source.rows}</span>
        <span className="font-mono text-[11px] font-medium text-ink-3">{refreshShort}</span>
      </span>
    </button>
  );
}
