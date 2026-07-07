// Next.js boot hook (runs once per server instance, before requests). We use it
// to fail fast on a misconfigured environment — see lib/env.ts / ADR-0003.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { validateEnv } = await import("@/lib/env");
    validateEnv();
  }
}
