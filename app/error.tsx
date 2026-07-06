"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";

/** Top-level fallback. Catches errors thrown by the shell LAYOUT itself (e.g. the
 *  Sidebar's getSourceHealth when the DB is unmigrated/unreachable) — which the
 *  nested (shell)/error.tsx cannot, since a segment's error boundary does not
 *  wrap its own layout. Self-contained: the shell chrome may have failed. */
export default function RootError({
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
    <div className="min-h-screen flex items-center justify-center bg-paper px-6">
      <div className="max-w-[520px] text-center">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-d mb-3">
          RagusIA
        </div>
        <h1 className="font-spectral text-[22px] font-medium text-ink m-0 mb-2">
          Servizio non disponibile
        </h1>
        <p className="font-hanken text-[13px] leading-[1.55] text-ink-2 m-0 mb-6">
          Impossibile raggiungere i dati. Verifica che le migrazioni siano state
          applicate e che il database sia inizializzato (<code className="font-mono text-[12px]">supabase db reset</code> +{" "}
          <code className="font-mono text-[12px]">pnpm seed</code>).
        </p>
        <button
          type="button"
          onClick={() => unstable_retry()}
          className="inline-flex items-center gap-2 bg-ink text-paper rounded-[10px] px-[15px] py-[10px] font-hanken text-[12.5px] font-semibold cursor-pointer hover:bg-[#2A2620] transition-colors"
        >
          Riprova
        </button>
      </div>
    </div>
  );
}
