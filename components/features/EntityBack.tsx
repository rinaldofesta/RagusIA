"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/primitives/kit";

/** Back-navigation button for entity detail pages (design line 890). */
export function EntityBack() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex items-center gap-[7px] bg-transparent border-none cursor-pointer py-[6px] font-hanken text-[12px] font-medium text-ink-3 mb-4 transition-colors hover:text-amber-d"
    >
      <Icon name="ph-arrow-left" className="text-[14px]" />
      Torna indietro
    </button>
  );
}
