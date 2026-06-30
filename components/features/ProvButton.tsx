"use client";

import type { ReactNode } from "react";
import { useProvenance } from "@/components/primitives/provenance";

/**
 * Minimal client wrapper around `useProvenance().open` for provenance
 * triggers whose markup doesn't match the standard `SourceChip` pill
 * (e.g. the Appalti risk-banner "Vedi fonte" button and the per-contract
 * seal icon button — design lines 419 / 478).
 */
export function ProvButton({
  sourceId,
  what,
  className,
  children,
}: {
  sourceId: string;
  what?: string;
  className?: string;
  children: ReactNode;
}) {
  const { open } = useProvenance();
  return (
    <button type="button" onClick={() => open(sourceId, what)} className={className}>
      {children}
    </button>
  );
}
