// Fixed-window rate limiting backed by the app's Postgres (migration 0004).
// Used to protect the expensive NL->SQL path and the public /api/source route.
// The limiter fails OPEN: any DB hiccup must never take a page down over a
// rate-limit bookkeeping error.
import { sql } from "@/lib/db/client";

/** Best-effort client IP from proxy headers (Vercel/most hosts set these). */
export function clientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}

/**
 * Count this request against a fixed window. Returns true if the call is
 * ALLOWED, false if the window's limit is exceeded.
 * @param scope  a short label for the limited action, e.g. "sql" or "source"
 * @param id     the caller identity, typically the client IP
 * @param limit  max requests permitted per window
 * @param windowSec  window length in seconds
 */
let warnedRateLimit = false;

export async function rateLimit(
  scope: string,
  id: string,
  limit: number,
  windowSec: number,
): Promise<boolean> {
  const win = Math.floor(Date.now() / 1000 / windowSec);
  const bucket = `${scope}:${id}:${win}`;
  const expiresEpoch = (win + 1) * windowSec; // window end, epoch seconds
  try {
    const [row] = (await sql`
      insert into rate_limits (bucket, hits, expires_at)
      values (${bucket}, 1, to_timestamp(${expiresEpoch}))
      on conflict (bucket) do update set hits = rate_limits.hits + 1
      returning hits
    `) as unknown as { hits: number }[];
    return (row?.hits ?? 1) <= limit;
  } catch (e) {
    // Fail OPEN so a bookkeeping error can't take a page down — but say so once,
    // or a broken limiter silently stops limiting (as it did with a Date param).
    if (!warnedRateLimit) {
      warnedRateLimit = true;
      console.error("[ratelimit] disabled (DB error), failing open:", (e as Error).message);
    }
    return true;
  }
}

/** Delete expired buckets. Called from the ingest job (daily) so the table
 *  stays small without a per-request write. */
export async function cleanupRateLimits(): Promise<void> {
  try {
    await sql`delete from rate_limits where expires_at < now()`;
  } catch {
    /* best effort */
  }
}
