# ADR-0003: Keyless by default; `gateway` is the only AI provider value

- **Date:** 2026-07-01 · **Status:** Accepted

## Context

RagusIA has two optional AI features: semantic retrieval (pgvector embeddings) and the NL→SQL
query engine. A civic-transparency app must be runnable and verifiable by anyone —
`git clone` → `supabase start` → `pnpm seed` → working app — without buying API keys. At the same
time, provider keys in code or env files are a liability.

## Decision

- **Keyless by default:** with `EMBEDDINGS_PROVIDER` and `QUERY_PROVIDER` unset, the app uses the
  deterministic keyword matcher + Postgres full-text search and curated answers. Every surface
  works; no external calls are made.
- **`gateway` is the only provider value.** Both features enable exclusively via the Vercel AI
  Gateway (`EMBEDDINGS_PROVIDER=gateway`, `QUERY_PROVIDER=gateway`), authenticated by OIDC on
  Vercel or `AI_GATEWAY_API_KEY` locally — no per-provider key ever appears in the codebase.
  Model choice is config (`QUERY_MODEL`, default `anthropic/claude-haiku-4.5`).
- Any AI failure (missing auth, gateway error, malformed output) degrades to the deterministic
  path — `embedText`/`generateSql` return `null`, never throw into a request.

## Consequences

- The demo/dev/CI story is fully deterministic and free; AI is an enhancement layer.
- Values like `EMBEDDINGS_PROVIDER=openai` are silently treated as disabled today; env
  validation should reject unknown values loudly, and the unused `@ai-sdk/openai` dependency
  should be removed (`docs/ROADMAP.md` M1).
- Swapping models is a one-line env change through the gateway; supporting a *direct* provider
  SDK would be a new ADR superseding this one.
