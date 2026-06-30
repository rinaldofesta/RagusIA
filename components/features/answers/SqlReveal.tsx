"use client";

import { useState } from "react";
import { Icon } from "@/components/primitives/kit";

/** "Mostra/Nascondi la query" toggle + dark read-only SQL block (design lines 285-296). */
export function SqlReveal({ sql }: { sql: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 bg-transparent border border-line rounded-[8px] px-3 py-[7px] font-mono text-[11.5px] font-medium text-ink-2 cursor-pointer transition-colors hover:border-line-2 hover:text-ink"
      >
        <Icon name="ph-terminal-window" className="text-[14px] text-teal" />{" "}
        {open ? "Nascondi la query" : "Mostra la query"}
      </button>
      {open ? (
        <div className="mt-[10px] bg-[#211D17] border border-[rgba(0,0,0,0.3)] rounded-[12px] overflow-hidden shadow-[0_8px_24px_rgba(28,26,23,0.12)]">
          <div className="flex items-center gap-2 px-[14px] py-[9px] border-b border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)]">
            <span className="w-[9px] h-[9px] rounded-full bg-[#C0623D]" />
            <span className="w-[9px] h-[9px] rounded-full bg-[#C2972A]" />
            <span className="w-[9px] h-[9px] rounded-full bg-[#7E7A3F]" />
            <span className="ml-[6px] font-mono text-[10px] font-medium text-[rgba(237,230,216,0.5)] uppercase tracking-[0.1em]">
              query · sola lettura
            </span>
          </div>
          <pre className="m-0 px-4 py-[15px] font-mono text-[12.5px] leading-[1.7] font-normal text-[#E6DECF] overflow-x-auto whitespace-pre">
            {sql}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
