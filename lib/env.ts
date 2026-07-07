// Centralized environment validation. Called once at boot from instrumentation.ts
// so a misconfigured deploy fails loudly at startup instead of silently talking to
// the wrong database or leaving an AI feature quietly disabled. See ADR-0003
// (keyless-by-default; `gateway` is the only provider value).

const LOCAL_DB_URL = "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const PROVIDERS = new Set(["", "gateway"]);

function isProd(): boolean {
  return process.env.NODE_ENV === "production";
}

/** The Postgres URL. Required in production — a missing URL there is a
 *  misconfiguration, not a cue to silently connect to localhost. In dev/test we
 *  fall back to the local Supabase stack, but say so out loud. */
export function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (url) return url;
  if (isProd()) {
    throw new Error("DATABASE_URL is required in production (no localhost fallback).");
  }
  console.warn("[env] DATABASE_URL unset → falling back to local Supabase (dev only).");
  return LOCAL_DB_URL;
}

/** Reject provider values other than "" (disabled) or "gateway". Anything else —
 *  e.g. a stray "openai" — would otherwise be silently treated as disabled. */
function checkProvider(name: "EMBEDDINGS_PROVIDER" | "QUERY_PROVIDER"): void {
  const raw = process.env[name] ?? "";
  if (!PROVIDERS.has(raw.toLowerCase())) {
    throw new Error(`${name}="${raw}" is invalid — use "" (disabled) or "gateway".`);
  }
}

/** Boot-time validation. Throws on misconfiguration so startup fails loudly. */
export function validateEnv(): void {
  databaseUrl(); // surfaces a missing production URL at boot
  checkProvider("EMBEDDINGS_PROVIDER");
  checkProvider("QUERY_PROVIDER");
}
