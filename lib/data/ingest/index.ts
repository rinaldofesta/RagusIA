import type { LiveAdapter } from "./framework";
import { istatAdapter } from "@/lib/data/adapters/sources/istat";
import { daitAdapter } from "@/lib/data/adapters/sources/dait";
import { indicepaAdapter } from "@/lib/data/adapters/sources/indicepa";
import { openpnrrAdapter } from "@/lib/data/adapters/sources/openpnrr";
import { opencoesioneAdapter } from "@/lib/data/adapters/sources/opencoesione";
import { bdapAdapter } from "@/lib/data/adapters/sources/bdap";
import { anacAdapter } from "@/lib/data/adapters/sources/anac";

// Live source adapters registered for Phase 2. Sources without a live adapter
// (e.g. eligendo — no per-comune 2023 data programmatically available) keep
// their committed seed data untouched.
export const liveAdapters: LiveAdapter[] = [
  istatAdapter,
  daitAdapter,
  indicepaAdapter,
  openpnrrAdapter,
  opencoesioneAdapter,
  bdapAdapter,
  anacAdapter,
];

export function selectAdapters(ids: string[]): LiveAdapter[] {
  const wanted = ids.filter((s) => s && s !== "all");
  if (!wanted.length) return liveAdapters;
  return liveAdapters.filter((a) => wanted.includes(a.id));
}
