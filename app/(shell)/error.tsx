"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";
import { Icon } from "@/components/primitives/kit";

/** Graceful fallback for the shell segment — e.g. when a domain getter throws
 *  because the database isn't seeded, instead of a raw 500. */
export default function ShellError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-[560px] mx-auto px-10 pt-[80px] pb-[90px] text-center">
      <div className="w-12 h-12 rounded-[12px] bg-amber-tint border border-[rgba(194,151,42,0.25)] flex items-center justify-center mx-auto mb-4">
        <Icon name="ph-warning-circle" weight="duotone" className="text-[24px] text-amber-d" />
      </div>
      <h1 className="font-spectral text-[22px] font-medium text-ink m-0 mb-2">
        Qualcosa è andato storto
      </h1>
      <p className="font-hanken text-[13px] leading-[1.55] text-ink-2 m-0 mb-6">
        Non è stato possibile caricare questa vista. Se il database non è ancora
        stato inizializzato, esegui <code className="font-mono text-[12px]">pnpm seed</code>.
      </p>
      <button
        type="button"
        onClick={() => unstable_retry()}
        className="inline-flex items-center gap-2 bg-ink text-paper rounded-[10px] px-[15px] py-[10px] font-hanken text-[12.5px] font-semibold cursor-pointer hover:bg-[#2A2620] transition-colors"
      >
        <Icon name="ph-arrow-clockwise" className="text-[15px]" /> Riprova
      </button>
    </div>
  );
}
