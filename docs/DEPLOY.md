# Deploy runbook (RagusIA → hosted Supabase + Vercel)

> Roadmap M3. The code-side prep (health endpoint, pool tuning, indexes) is merged;
> the steps below need **your** Supabase and Vercel accounts (interactive login and
> provisioning), so they're documented here rather than automated. Run them from the
> repo root. Anything prefixed `!` in a Claude session runs in-session so its output
> lands in the chat.

## 0. Prerequisites
- A Supabase account and a Vercel account.
- `supabase` CLI (already used locally) and `vercel` CLI (`pnpm add -g vercel` or `npx vercel`).
- The green CI gate on `main` is your pre-deploy check — don't deploy a red `main`.

## 1. Provision hosted Supabase (3.1)
1. Create a project in the Supabase dashboard (choose the EU region closest to Ragusa; note the DB password).
2. Link and push the schema + seed:
   ```bash
   supabase login
   supabase link --project-ref <your-project-ref>
   supabase db push                       # applies migrations 0000–0005
   DATABASE_URL="<hosted direct connection>" pnpm exec tsx lib/db/seed.ts
   ```
   Use the **direct** connection string (port 5432) for the one-off seed.
3. **Verify the lockdown carried over** (migration 0003): in the SQL editor, confirm
   `select relrowsecurity from pg_class where relname='fact_budget'` is `true`. Belt to
   the RLS: in **Project Settings → Data API**, remove `public` from the exposed schemas
   (the app doesn't use the Data API; RLS already denies `anon`, this closes it entirely).

## 2. Connection string for serverless
Vercel functions churn connections, so point the app at Supabase's **transaction pooler**
(Supavisor, port **6543**), not the direct connection:
```
postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
```
`lib/db/client.ts` already sets `prepare: false` (pooler-compatible) and a small pool
(`max: 5`, `idle_timeout`). Tune with `DB_POOL_MAX` if you hit Supabase's connection cap.

## 3. Deploy to Vercel (3.2)
```bash
vercel link
vercel env add DATABASE_URL production          # the pooler URL from step 2
vercel env add QUERY_PROVIDER production         # "gateway" to enable NL→SQL, else leave unset
vercel env add QUERY_MODEL production            # e.g. anthropic/claude-haiku-4.5 (optional)
vercel env add EMBEDDINGS_PROVIDER production    # "gateway" to enable pgvector, else unset
vercel --prod
```
- AI Gateway auth on Vercel is OIDC — no provider key in env.
- The build prerenders with `DATABASE_URL` set, so the hosted DB must be reachable at build.
- Smoke-check after deploy: `GET /api/health` should return `{ db: true, ... }` (200), and
  the keyless surfaces should render even with the providers unset.

## 4. Repoint scheduled ingestion
The daily ingest runs in GitHub Actions (ADR-0004), not Vercel. Update the repo secret
`DATABASE_URL` (Settings → Secrets → Actions) to the hosted **direct** connection (5432 —
ingestion is a long batch job, not serverless). The count-guard, staleness check, and
non-zero-exit alerting then protect the hosted data.

## 5. Optional — activate the query_reader DB backstop (M2.5)
Today the app connects as `postgres`, which **cannot** `SET ROLE query_reader` (reserved
role; see ADR-0001), so the DB-level least-privilege backstop is inert and the boundary is
the hardened allowlist + read-only transaction. To turn the backstop on, connect the app as
a dedicated role that can assume `query_reader`:
```sql
-- run against the hosted DB as an admin
create role ragusia_app login password '<strong-password>' bypassrls;  -- bypassrls: app reads/writes
grant query_reader to ragusia_app with set true;                        -- SET ROLE for generated SQL
-- grant ragusia_app the privileges the app needs on the public tables (SELECT for surfaces;
-- INSERT/UPDATE/DELETE if it will also run the seed/ingest as this role).
```
Then set `DATABASE_URL` to connect as `ragusia_app`. `execReadOnly`'s runtime probe detects
the now-assumable role automatically and `/api/health` will report `queryRoleApplied: true`.
**Caveat:** whether a non-superuser hosted `postgres` can create a `bypassrls` role varies —
verify in your project before relying on this; otherwise stay on `postgres` (secure via the
allowlist) and treat this as a later hardening.

## 6. Follow-up — caching (3.3)
Deferred to do against the real deploy (CDN + hosted DB), where it can be measured. The app
is `force-dynamic` today (a DB round-trip per page view). Options in Next 16:
- **ISR** (simplest): drop `force-dynamic` from `app/(shell)/layout.tsx`, add
  `export const revalidate = 3600` to the read-only surfaces (`domini`, `fonti`, `esplora`,
  `mappa`), keep `/chiedi` dynamic. Add an on-demand `revalidatePath` ping from the ingest
  Action after a successful run so fresh data appears immediately.
- **Cache Components** (Next 16's model): enable `cacheComponents: true` and mark repository
  reads with `'use cache'` + `cacheLife`. More work, PPR by default. See the bundled
  `node_modules/next/dist/docs/.../cacheComponents.md` and the migration guide.

## Definition of done
Public URL on Vercel serving live-ingested data; `/api/health` green; RLS/allowlist/read-only
protections all active against the hosted DB; the ingest Action targeting the hosted DB.
