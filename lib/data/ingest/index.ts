import type { LiveAdapter } from "./framework";

// Live source adapters are registered here as they are implemented in Phase 2.
// Sources without a live adapter keep their committed seed data untouched.
export const liveAdapters: LiveAdapter[] = [];

export function selectAdapters(ids: string[]): LiveAdapter[] {
  const wanted = ids.filter((s) => s && s !== "all");
  if (!wanted.length) return liveAdapters;
  return liveAdapters.filter((a) => wanted.includes(a.id));
}
