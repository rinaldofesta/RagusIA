"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Icon } from "@/components/primitives/kit";

/** The Chiedi search box (design lines 102-106). */
export function AskBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    router.push(`/chiedi?q=${encodeURIComponent(q)}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-[10px] bg-card-2 border-[1.5px] border-line-2 rounded-[15px] py-[9px] pr-[9px] pl-[17px] shadow-[0_1px_2px_rgba(28,26,23,0.04),0_10px_30px_rgba(28,26,23,0.055)]"
    >
      <Icon name="ph-magnifying-glass" className="text-[19px] text-amber" />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Es. Quanto vale il bilancio 2024 per missione?"
        className="flex-1 border-none outline-none bg-transparent font-hanken text-[16px] text-ink min-w-0 placeholder:text-ink-3"
      />
      <button
        type="submit"
        className="flex items-center gap-[7px] bg-amber text-white border-none rounded-[10px] px-4 py-[10px] font-hanken text-[13.5px] font-semibold cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] hover:bg-amber-d transition-colors"
      >
        Chiedi <Icon name="ph-arrow-right" className="text-[15px]" />
      </button>
    </form>
  );
}
