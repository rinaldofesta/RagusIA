// Liveness/readiness probe for uptime monitors. Reports DB connectivity (the
// 200/503 signal), source health, whether the least-privilege query_reader role
// is actually assumable here (inert under Supabase's `postgres` — see ADR-0001),
// and when data was last ingested. Never cached.
import { NextResponse } from "next/server";
import { sql } from "@/lib/db/client";
import { isQueryEnabled } from "@/lib/query/provider";

export const dynamic = "force-dynamic";

export async function GET() {
  const health: {
    db: boolean;
    sourcesOk: string | null;
    queryProvider: boolean;
    queryRoleApplied: boolean;
    lastIngestAt: string | null;
  } = {
    db: false,
    sourcesOk: null,
    queryProvider: isQueryEnabled(),
    queryRoleApplied: false,
    lastIngestAt: null,
  };

  try {
    await sql`select 1`;
    health.db = true;

    const [s] = (await sql`
      select count(*) filter (where status = 'ok')::int as ok, count(*)::int as total from sources
    `) as unknown as { ok: number; total: number }[];
    if (s) health.sourcesOk = `${s.ok}/${s.total}`;

    // Ground-truth: can the app role actually SET ROLE into the reader role?
    health.queryRoleApplied = await sql
      .begin(async (tx) => {
        await tx.unsafe("set local role query_reader");
      })
      .then(() => true)
      .catch(() => false);

    const [i] = (await sql`
      select to_char(
        max(case when ran_at ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4} [0-9]{2}:[0-9]{2}$'
                 then to_timestamp(ran_at, 'DD/MM/YYYY HH24:MI') else null end),
        'YYYY-MM-DD"T"HH24:MI'
      ) as last from ingest_runs where status = 'ok'
    `) as unknown as { last: string | null }[];
    health.lastIngestAt = i?.last ?? null;
  } catch {
    // DB unreachable — health.db stays false → 503 below.
  }

  return NextResponse.json(health, { status: health.db ? 200 : 503 });
}
