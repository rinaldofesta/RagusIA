# ADR-0004: Scheduled ingestion runs in GitHub Actions, never in a request path

- **Date:** 2026-07-02 · **Status:** Accepted

## Context

Ingestion is heavy and slow: ANAC is ~75 MB of national zips per year window, BDAP a regional
zip, and ISTAT's SDMX endpoint returns HTTP 500 to Node's `fetch` while serving the identical
request to `curl` fine. Vercel Cron invokes a serverless function — bounded memory, bounded
execution time, no system `curl`. A request-path trigger would also expose an unauthenticated
heavy endpoint.

## Decision

Ingestion is a **script-only concern** (`pnpm ingest`, `lib/data/ingest/run.ts`), scheduled by a
GitHub Action (`.github/workflows/ingest.yml`): daily cron (04:00 UTC) plus `workflow_dispatch`
with a sanitized source filter, 30-minute timeout, `DATABASE_URL` as a repository secret. The app
never imports the ingest framework; no API route can trigger it. Adapters may shell out to system
`curl` (`curlText`/`curlBuffer`) for endpoints incompatible with Node's fetch or behind WAFs.

## Consequences

- Ingest gets a real Linux box (memory, `curl`, generous time) for free; the app's runtime stays
  small.
- Alerting must be Actions-native: the run must exit non-zero on degraded sources for GitHub to
  notify anyone (currently it doesn't — `docs/ROADMAP.md` M1).
- The Action's runner is a hard dependency on `curl` being present (fine on `ubuntu-latest`).
- The prod `DATABASE_URL` lives as a GitHub secret; rotating it means updating one secret.
- Freshness is bounded by the cron cadence (daily) — acceptable for data that changes at most
  daily; staleness alerting is roadmap M2.
