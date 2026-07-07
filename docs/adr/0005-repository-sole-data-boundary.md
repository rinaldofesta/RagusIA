# ADR-0005: `lib/data/repository.ts` is the sole data boundary the UI imports

- **Date:** 2026-06-30 · **Status:** Accepted

## Context

Fourteen surfaces were built in parallel (partly by concurrent agents) against a data model that
was destined to change underneath them — Phase 1 seeded from design JSON, Phase 2 swapped in live
adapters. Letting surfaces query Drizzle or read seed files directly would have coupled every
surface to the storage shape.

## Decision

Surfaces import data **only** from `lib/data/repository.ts` (typed async functions returning
model types from `lib/model/types`). Never from `lib/db/*`, `lib/data/seed/*`, or adapter
modules. The rule is stated in `design/SURFACE_GUIDE.md` and enforced by review.

## Consequences

- Phase 2 replaced seed data with live ingestion without touching a single surface — the seam
  held exactly as designed.
- Cross-cutting concerns land in one place: per-request memoization (React `cache()`) and batch
  helpers (`inArray`) were added to the repository, and every surface benefited unchanged.
- Future caching (ISR / `use cache`) and any storage migration also land at this layer
  (`docs/ROADMAP.md` M3).
- The repository grows wide (one function per surface need) — an accepted trade-off for a thin,
  explicit contract.
