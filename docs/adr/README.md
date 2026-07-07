# Architecture Decision Records

Current, binding decisions. Written retroactively on 2026-07-07 to capture decisions made during
Phases 1–2 and the 2026-07 hardening pass; each record states the date the decision was actually
made. When a decision is revisited, supersede the record (new ADR, link both ways) — don't edit
history.

| ADR | Decision |
|---|---|
| [0001](0001-nl-sql-layered-defense.md) | NL→SQL runs behind a layered defense; the `query_reader` DB role is the durable boundary |
| [0002](0002-count-guard-verify-before-write.md) | Ingestion count-guard verifies **before** writing and blocks suspicious runs |
| [0003](0003-keyless-by-default-gateway-provider.md) | Keyless by default; `gateway` is the only AI provider value |
| [0004](0004-ingestion-in-github-actions.md) | Scheduled ingestion runs in GitHub Actions, never in a request path |
| [0005](0005-repository-sole-data-boundary.md) | `lib/data/repository.ts` is the sole data boundary the UI imports |
| [0006](0006-seed-baseline-live-overlay.md) | Verified curated seed as baseline; live adapters overlay it idempotently |

## Template

```markdown
# ADR-NNNN: Title

- **Date:** YYYY-MM-DD · **Status:** Accepted

## Context
What situation/forces made a decision necessary.

## Decision
What we decided (present tense, active voice).

## Consequences
What follows — good, bad, and the invariants others must respect.
```
