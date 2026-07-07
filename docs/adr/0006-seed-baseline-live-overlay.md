# ADR-0006: Verified curated seed as baseline; live adapters overlay it idempotently

- **Date:** 2026-07-01 · **Status:** Accepted

## Context

Not everything has an open per-comune API: some fields exist in no machine-readable source
(assessor portfolios, election results per comune, km² surface), and any live source can be down
for weeks. The app must always render complete, honest surfaces.

## Decision

- **Seed is the verified baseline:** `pnpm seed` loads curated, manually-verified data (ported
  from the design) for every surface. Provenance marks estimates/curated values as such
  (`est` dots).
- **Live adapters overlay:** each `apply()` is an idempotent upsert over the same tables,
  replacing exactly the slice of the model its source feeds and preserving curated fields the
  source lacks (e.g. DAIT gives the roster, portfolios stay curated and are carried over by
  surname match).
- **Failures preserve last-good:** a failed or guard-blocked ingest leaves prior data in place
  and flips the source to `warn` (ADR-0002).
- **Seed never clobbers live data:** `lib/db/seed.ts` refuses to run when successful
  `ingest_runs` exist (override: `SEED_FORCE=1`).

## Consequences

- The app is never empty and never lies: every value is either live (with retrieval date) or
  curated (marked as such) — the provenance chip tells the reader which.
- Re-running `pnpm seed` on a fresh DB is always safe; on a live DB it's guarded.
- Adapters must stay idempotent (stable IDs, delete-then-insert or upsert per slice) — a
  constraint on every new adapter.
- The seed data ages: curated values need occasional manual re-verification, which provenance
  dates make visible.
