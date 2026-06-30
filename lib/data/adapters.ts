// Phase-1 source adapters. Each public source is represented by an adapter that
// yields its provenance (and, in Phase 2, its live records). In Phase 1 the
// adapter returns the committed seed provenance row. The repository and UI never
// import adapters directly — this is the swappable ingestion seam for Phase 2,
// where `load()` will fetch + cache live data behind the same interface.

import type { Source } from "@/lib/model/types";
import { sources } from "@/lib/data/seed/sources";

export interface SourceAdapter {
  id: string;
  /** Phase 1: returns seed provenance. Phase 2: fetch live + cache, real health. */
  load(): Promise<{ provenance: Source }>;
}

export function seedAdapter(id: string): SourceAdapter {
  return {
    id,
    async load() {
      const provenance = sources[id];
      if (!provenance) throw new Error(`Unknown source adapter: ${id}`);
      return { provenance };
    },
  };
}

export const adapters: SourceAdapter[] = Object.keys(sources).map(seedAdapter);
