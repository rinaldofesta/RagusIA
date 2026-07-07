-- Secondary indexes for the query shapes the fact tables and the count-guard use.
-- The fact tables are small today (Postgres will seq-scan regardless), so these
-- are preventive — cheap to add now, useful once ANAC contracts and the daily
-- ingest_runs history grow. Only non-redundant indexes are created: fact_pnrr
-- (PK missione_code) and fact_coesione (PK stato) already cover their filters.

-- NL->SQL commonly filters/aggregates contracts by year.
create index if not exists fact_contracts_anno_idx on fact_contracts (anno);

-- Budget is queried by year and joined/grouped by mission.
create index if not exists fact_budget_anno_missione_idx on fact_budget (anno, missione_code);

-- prevRowCount() reads the latest ok run per source on every ingest; this grows
-- by one row per source per day.
create index if not exists ingest_runs_source_ranat_idx on ingest_runs (source_id, ran_at desc);
