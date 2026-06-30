// Optional semantic-embeddings wrapper. Phase 1 runs with NO external keys:
// when EMBEDDINGS_PROVIDER is unset, embedText() returns null and callers fall
// back to the deterministic matcher + Postgres full-text search.
//
// EMBEDDINGS_PROVIDER:
//   ""        → disabled (default; deterministic fallback, no setup needed)
//   "gateway" → Vercel AI Gateway. Auth is handled by the platform — OIDC
//               (VERCEL_OIDC_TOKEN via `vercel env pull`) on Vercel, with no
//               provider key in application code. The model is addressed by its
//               "creator/model" id so the Gateway handles routing and failover.

export const EMBEDDING_DIM = 1536; // openai/text-embedding-3-small
const MODEL = "openai/text-embedding-3-small";

export function isEmbeddingsEnabled(): boolean {
  return (process.env.EMBEDDINGS_PROVIDER ?? "").toLowerCase() === "gateway";
}

export async function embedText(text: string): Promise<number[] | null> {
  if (!isEmbeddingsEnabled()) return null;
  try {
    const { embed } = await import("ai");
    const { embedding } = await embed({ model: MODEL, value: text });
    return embedding;
  } catch (err) {
    console.warn("[embeddings] disabled (gateway error):", (err as Error).message);
    return null;
  }
}

/** Cosine similarity for in-memory ranking when needed. */
export function cosine(a: number[], b: number[]): number {
  let dot = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}
