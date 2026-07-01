// Idempotent seed runner: normalizes the committed seed modules into the object
// model and upserts them into Postgres. Run with `pnpm seed` (after `supabase
// start` + `db reset`). Embeddings are computed only when EMBEDDINGS_PROVIDER is
// set; otherwise that step is skipped and the app uses the deterministic fallback.

import { db, sql } from "./client";
import * as t from "./schema";
import * as seed from "@/lib/data/seed";
import { embedText, isEmbeddingsEnabled } from "@/lib/search/embeddings";
import { seedFacts } from "@/lib/data/facts";

function withOrd<T>(rows: T[]): (T & { ord: number })[] {
  return rows.map((r, i) => ({ ...r, ord: i }));
}

async function run() {
  console.log("· seeding RagusIA…");

  // Order does not matter (no FKs); wipe then insert for idempotency.
  await db.delete(t.embeddings);
  await db.delete(t.sources);
  await db.delete(t.entities);
  await db.delete(t.navItems);
  await db.delete(t.suggested);
  await db.delete(t.domainCards);
  await db.delete(t.domainDetails);
  await db.delete(t.bilancio);
  await db.delete(t.appalti);
  await db.delete(t.organigramma);
  await db.delete(t.elezione);
  await db.delete(t.qa);
  await db.delete(t.services);
  await db.delete(t.documents);
  await db.delete(t.docSections);
  await db.delete(t.mapLayers);
  await db.delete(t.mapMarkers);
  await db.delete(t.graphTypes);
  await db.delete(t.graphModel);

  await db.insert(t.sources).values(Object.values(seed.sources));
  await db.insert(t.entities).values(Object.values(seed.entities));
  await db.insert(t.navItems).values(withOrd(seed.navItems));
  await db.insert(t.suggested).values([
    ...seed.suggested.map((s, i) => ({ ...s, kind: "civica" as const, ord: i })),
    ...seed.suggestedServizi.map((s, i) => ({ ...s, kind: "servizio" as const, ord: i })),
  ]);
  await db.insert(t.domainCards).values(
    seed.dominiCards.map((c, i) => ({
      slug: c.slug, icon: c.icon, name: c.name, value: c.value, sub: c.sub,
      sourceId: c.sourceId, srcVal: c.srcVal, srcTag: c.srcTag, status: c.status,
      full: c.full ?? false, ord: i,
    })),
  );
  await db.insert(t.domainDetails).values(
    Object.values(seed.domainDetails).map((d) => ({
      slug: d.slug, icon: d.icon, title: d.title, sub: d.sub, kind: d.kind,
      kpis: d.kpis, chart: d.chart ?? null, sources: d.sources, cta: d.cta ?? null,
    })),
  );
  await db.insert(t.bilancio).values({ id: "default", ...seed.bilancio });
  await db.insert(t.appalti).values({ id: "default", ...seed.appalti });
  await db.insert(t.organigramma).values({ id: "default", ...seed.organigramma });
  await db.insert(t.elezione).values({ id: "default", ...seed.elezione });
  await db.insert(t.qa).values(Object.values(seed.qaMeta));
  await db.insert(t.services).values(Object.values(seed.services));
  await db.insert(t.documents).values(seed.docs);
  await db.insert(t.docSections).values([
    ...seed.docSections.map((s, i) => ({ ...s, kind: "trasparente" as const, ord: i })),
    ...seed.alboCats.map((s, i) => ({ ...s, kind: "albo" as const, ord: i })),
  ]);
  await db.insert(t.mapLayers).values(withOrd(seed.mapLayers));
  await db.insert(t.mapMarkers).values(seed.mapMarkers);
  await db.insert(t.graphTypes).values(withOrd(seed.graphTypes));
  await db.insert(t.graphModel).values({
    id: "default",
    center: seed.graphModel.center,
    clusters: seed.graphModel.clusters,
    cross: seed.graphModel.cross,
  });

  // Optional embeddings (semantic retrieval). Skipped without a provider.
  if (isEmbeddingsEnabled()) {
    console.log("· computing embeddings…");
    const rows: { id: string; ownerType: "qa" | "service" | "document"; ownerId: string; content: string }[] = [];
    for (const q of Object.values(seed.qaMeta)) rows.push({ id: `qa:${q.id}`, ownerType: "qa", ownerId: q.id, content: q.question });
    for (const s of Object.values(seed.services)) rows.push({ id: `service:${s.id}`, ownerType: "service", ownerId: s.id, content: `${s.question} ${s.nome} ${s.sintesi}` });
    for (const d of seed.docs) rows.push({ id: `document:${d.id}`, ownerType: "document", ownerId: d.id, content: `${d.title} ${d.tipo} ${d.sez} ${d.uff}` });
    for (const r of rows) {
      const embedding = await embedText(r.content);
      if (embedding) await db.insert(t.embeddings).values({ ...r, embedding });
    }
    console.log(`· embedded ${rows.length} items`);
  } else {
    console.log("· embeddings skipped (EMBEDDINGS_PROVIDER unset) — deterministic fallback");
  }

  await seedFacts();
  console.log("· fact tables seeded (query substrate)");

  console.log("✓ seed complete");
}

run()
  .then(() => sql.end())
  .catch(async (e) => {
    console.error(e);
    await sql.end();
    process.exit(1);
  });
