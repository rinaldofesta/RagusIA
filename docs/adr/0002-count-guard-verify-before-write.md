# ADR-0002: Ingestion count-guard verifies before writing and blocks suspicious runs

- **Date:** 2026-07-01 (blocking semantics 2026-07-06) · **Status:** Accepted

## Context

Government open-data endpoints fail in ways that look like success: an empty CSV, a truncated
zip, a filter that suddenly matches nothing. An ingest that trustingly upserts such a result
destroys last-good data with no error anywhere. The first guard implementation only *logged* an
alert — the damage was already written.

## Decision

`runIngest` (`lib/data/ingest/framework.ts`) computes a verdict **before** calling the adapter's
`apply()`, comparing the fetched row count to the previous *successful* run (from `ingest_runs`):

- `empty` (0 rows over a non-empty baseline) — **always blocks** the write. Not overridable:
  a forced empty write would both wipe last-good data and reset the baseline to 0, silently
  disabling the guard for the next run.
- `drop` (> 50% fall) — blocks unless explicitly forced (`pnpm ingest --force` /
  `INGEST_FORCE=1`), for when a real contraction is expected.
- A blocked write preserves last-good data, flips the source to `warn` (`a rischio` in the UI),
  and records an `ingest_runs` row with the verdict (`⛔ COUNT-GUARD` in the log).

## Consequences

- A silently-emptying source can never destroy data; the worst case is stale-but-honest data
  marked `a rischio`.
- `ingest_runs` doubles as the audit log: every run (ok, warn, blocked) leaves a row with
  `rows`, `prevRows`, `delta`, `guard`, `note`.
- The baseline reads only `status='ok'` rows, so one failed run doesn't erase it.
- Sources ingest in parallel bounded by `INGEST_CONCURRENCY` (default 4) — the guard and
  provenance writes are per-source, so concurrency doesn't change the semantics.
- A blocked run currently exits 0 (`lib/data/ingest/run.ts`) so the scheduled Action cannot
  alert on it — fixing that is `docs/ROADMAP.md` M1.
