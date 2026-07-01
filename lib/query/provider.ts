// LLM provider for the NL→SQL engine. Mirrors lib/search/embeddings.ts:
// disabled by default (app stays keyless → curated matcher). When
// QUERY_PROVIDER=gateway, SQL is generated through the Vercel AI Gateway
// (OIDC / AI_GATEWAY_API_KEY — no provider key in code). Model id is a plain
// "creator/model" string so the Gateway handles routing.

export function isQueryEnabled(): boolean {
  return (process.env.QUERY_PROVIDER ?? "").toLowerCase() === "gateway";
}

// Gateway model slug uses dots for the version (e.g. claude-haiku-4.5).
const MODEL = process.env.QUERY_MODEL ?? "anthropic/claude-haiku-4.5";

/** Ask the model for one SQL statement. Returns null when disabled or on error. */
export async function generateSql(system: string, prompt: string): Promise<string | null> {
  if (!isQueryEnabled()) return null;
  try {
    const { generateText } = await import("ai");
    const { text } = await generateText({
      model: MODEL,
      system,
      prompt,
      temperature: 0,
    });
    return text;
  } catch (err) {
    console.warn("[query] provider error:", (err as Error).message);
    return null;
  }
}
