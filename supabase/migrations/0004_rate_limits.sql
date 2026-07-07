-- Fixed-window rate-limit counters (lib/ratelimit.ts). One row per
-- <scope>:<ip>:<window> bucket; the app upserts and reads the hit count. No new
-- infra — the app's own Postgres is the store. Locked down like every other
-- public table (migration 0003 already RLS-enabled the tables that existed then;
-- this one is created afterwards, so enable + revoke here too).
create table if not exists rate_limits (
  bucket text primary key,
  hits integer not null default 0,
  expires_at timestamptz not null
);

alter table rate_limits enable row level security;
revoke all on rate_limits from anon, authenticated;

-- Supports the periodic cleanup of expired buckets (run from the ingest job).
create index if not exists rate_limits_expires_idx on rate_limits (expires_at);
