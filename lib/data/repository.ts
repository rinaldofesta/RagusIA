// The repository is the ONLY data boundary the UI may import. It reads the
// object model from Postgres (Drizzle) and returns typed model objects. No
// surface imports seed JSON, Drizzle tables, or adapters directly.

import { eq, sql as dsql, desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import * as t from "@/lib/db/schema";
import { buildGraph } from "@/lib/graph/layout";
import { graphColors } from "@/lib/data/seed/graph";
import { matchQA, docTokens, docMatches } from "@/lib/search/matcher";
import { embedText, isEmbeddingsEnabled } from "@/lib/search/embeddings";
import type {
  Source, Entity, NavItem, SuggestedQuestion, DomainCard, DomainDetail,
  BilancioData, AppaltiData, Organigramma, Elezione, DocItem, DocSection,
  QA, Service, MapLayer, MapMarker, GraphTypeMeta, GraphNode, GraphLink,
  SourceHealth, Bar, ContrattoRow,
} from "@/lib/model/types";

// The 12-source provenance registry (design line ~1661). Excludes the
// service/portal sources (atto, comune, anpr) from the public-data count.
const FONTI_ORDER = [
  "istat", "anac", "bdap", "opencoesione", "openpnrr", "indicepa",
  "dait", "eligendo", "ispra", "eea", "mim", "iccu",
] as const;

const LAST_REFRESH = "30/06 03:12"; // sidebar footer (design line ~84)

// ---------- Ingestion runs (count-guard history) ----------
export interface IngestRun {
  sourceId: string;
  ranAt: string;
  status: "ok" | "warn";
  rows: number;
  prevRows: number | null;
  delta: number | null;
  guard: "first" | "ok" | "drop" | "empty";
  note: string | null;
}
export async function getIngestRuns(sourceId?: string, limit = 30): Promise<IngestRun[]> {
  const base = db.select().from(t.ingestRuns).orderBy(desc(t.ingestRuns.ranAt)).limit(limit);
  const rows = sourceId
    ? await db.select().from(t.ingestRuns).where(eq(t.ingestRuns.sourceId, sourceId)).orderBy(desc(t.ingestRuns.ranAt)).limit(limit)
    : await base;
  return rows.map((r) => ({
    sourceId: r.sourceId, ranAt: r.ranAt, status: r.status, rows: r.rows,
    prevRows: r.prevRows, delta: r.delta, guard: r.guard, note: r.note,
  }));
}

// ---------- Sources / provenance ----------
export async function getSources(): Promise<Source[]> {
  return db.select().from(t.sources);
}
export async function getSource(id: string): Promise<Source | null> {
  const [row] = await db.select().from(t.sources).where(eq(t.sources.id, id));
  return row ?? null;
}
export async function getFontiRegistry(): Promise<Source[]> {
  const all = await getSources();
  const byId = new Map(all.map((s) => [s.id, s]));
  return FONTI_ORDER.map((id) => byId.get(id)).filter((s): s is Source => !!s);
}
export async function getSourceHealth(): Promise<SourceHealth> {
  const list = await getFontiRegistry();
  const warn = list.filter((s) => s.status === "warn");
  return {
    total: list.length,
    ok: list.filter((s) => s.status === "ok").length,
    warn: warn.length,
    lastRefresh: LAST_REFRESH,
    atRisk: warn.map((s) => s.short),
  };
}

// ---------- Entities ----------
export async function getEntity(id: string): Promise<Entity | null> {
  const [row] = await db.select().from(t.entities).where(eq(t.entities.id, id));
  return row ?? null;
}
export async function getEntitySources(id: string): Promise<Source[]> {
  const ent = await getEntity(id);
  if (!ent) return [];
  const all = await getSources();
  const byId = new Map(all.map((s) => [s.id, s]));
  return ent.sources.map((sid) => byId.get(sid)).filter((s): s is Source => !!s);
}
/** Operatore-economico view: its bar from `operatori` + its contracts. */
export async function getOperatore(
  entityId: string,
): Promise<{ meta: Bar | null; contratti: ContrattoRow[] }> {
  const app = await getAppalti();
  return {
    meta: app.operatori.find((o) => o.entityId === entityId) ?? null,
    contratti: app.contratti.filter((c) => c.entityId === entityId),
  };
}

// ---------- Nav / Chiedi ----------
export async function getNav(): Promise<NavItem[]> {
  const rows = await db.select().from(t.navItems).orderBy(t.navItems.ord);
  return rows.map(({ id, label, icon, count }) => ({ id, label, icon, count }));
}
export async function getSuggested(): Promise<{ civica: SuggestedQuestion[]; servizi: SuggestedQuestion[] }> {
  const rows = await db.select().from(t.suggested).orderBy(t.suggested.ord);
  const pick = (kind: "civica" | "servizio") =>
    rows.filter((r) => r.kind === kind).map(({ id, icon, q }) => ({ id, icon, q }));
  return { civica: pick("civica"), servizi: pick("servizio") };
}

// ---------- Domini ----------
export async function getDominiCards(): Promise<DomainCard[]> {
  const rows = await db.select().from(t.domainCards).orderBy(t.domainCards.ord);
  return rows.map(({ slug, icon, name, value, sub, sourceId, srcVal, srcTag, status, full }) => ({
    slug, icon, name, value, sub, sourceId, srcVal, srcTag, status, full,
  }));
}
export async function getDomainDetail(slug: string): Promise<DomainDetail | null> {
  const [row] = await db.select().from(t.domainDetails).where(eq(t.domainDetails.slug, slug));
  if (!row) return null;
  return {
    slug: row.slug, icon: row.icon, title: row.title, sub: row.sub, kind: row.kind,
    kpis: row.kpis, chart: row.chart ?? undefined, sources: row.sources, cta: row.cta ?? null,
  };
}
export async function getBilancio(): Promise<BilancioData> {
  const [row] = await db.select().from(t.bilancio).where(eq(t.bilancio.id, "default"));
  return { kpis: row.kpis, missioni: row.missioni, trend: row.trend, capitoli: row.capitoli };
}
export async function getAppalti(): Promise<AppaltiData> {
  const [row] = await db.select().from(t.appalti).where(eq(t.appalti.id, "default"));
  return { kpis: row.kpis, operatori: row.operatori, uffici: row.uffici, contratti: row.contratti };
}
export async function getOrganigramma(): Promise<Organigramma> {
  const [row] = await db.select().from(t.organigramma).where(eq(t.organigramma.id, "default"));
  return { sindaco: row.sindaco, assessori: row.assessori, settori: row.settori, presidente: row.presidente };
}
export async function getElezione(): Promise<Elezione> {
  const [row] = await db.select().from(t.elezione).where(eq(t.elezione.id, "default"));
  return {
    data: row.data, affluenza: row.affluenza, tipo: row.tipo,
    candidati: row.candidati, liste: row.liste, consiglieri: row.consiglieri, presidente: row.presidente,
  };
}

// ---------- Esplora (graph) ----------
export async function getGraph(): Promise<{ nodes: GraphNode[]; links: GraphLink[]; types: GraphTypeMeta[]; W: number; H: number }> {
  const [model] = await db.select().from(t.graphModel).where(eq(t.graphModel.id, "default"));
  const typeRows = await db.select().from(t.graphTypes).orderBy(t.graphTypes.ord);
  const { nodes, links, W, H } = buildGraph(
    { center: model.center, clusters: model.clusters, cross: model.cross },
    graphColors,
  );
  const types = typeRows.map(({ id, label, count, color }) => ({ id, label, count, color }));
  return { nodes, links, types, W, H };
}

// ---------- Mappa ----------
export async function getMap(): Promise<{ layers: MapLayer[]; markers: MapMarker[] }> {
  const layers = await db.select().from(t.mapLayers).orderBy(t.mapLayers.ord);
  const markerRows = await db.select().from(t.mapMarkers);
  const markers: MapMarker[] = markerRows.map((m) => ({
    id: m.id, layer: m.layer, lat: m.lat, lon: m.lon, label: m.label, type: m.type,
    entityId: m.entityId ?? undefined, sourceId: m.sourceId ?? undefined,
  }));
  return {
    layers: layers.map(({ id, label, count, color, colorHex, icon }) => ({ id, label, count, color, colorHex, icon })),
    markers,
  };
}

// ---------- Documenti ----------
export async function getDocuments(): Promise<DocItem[]> {
  return db.select().from(t.documents);
}
export async function getDocSections(): Promise<{ trasparente: DocSection[]; albo: DocSection[] }> {
  const rows = await db.select().from(t.docSections).orderBy(t.docSections.ord);
  const pick = (kind: "trasparente" | "albo") =>
    rows.filter((r) => r.kind === kind).map(({ id, label, count }) => ({ id, label, count }));
  return { trasparente: pick("trasparente"), albo: pick("albo") };
}
export async function searchDocuments(q: string, filter?: string): Promise<DocItem[]> {
  const docs = await getDocuments();
  const tokens = docTokens(q);
  return docs.filter((d) => {
    if (filter && !d.tags.includes(filter)) return false;
    return docMatches(d, tokens);
  });
}

// ---------- Chiedi: QA / services / routing ----------
export async function getQA(id: string): Promise<QA | null> {
  const [row] = await db.select().from(t.qa).where(eq(t.qa.id, id));
  return row ?? null;
}
export async function getService(id: string): Promise<Service | null> {
  const [row] = await db.select().from(t.services).where(eq(t.services.id, id));
  return row ?? null;
}

async function semanticRoute(q: string): Promise<string | null> {
  try {
    const vec = await embedText(q);
    if (!vec) return null;
    const lit = `[${vec.join(",")}]`;
    const rows = await db.execute(
      dsql`select owner_id from ${t.embeddings} where owner_type in ('qa','service') order by embedding <=> ${lit}::vector limit 1`,
    );
    const list = (rows as unknown as { owner_id?: string }[]);
    return list[0]?.owner_id ?? null;
  } catch {
    return null;
  }
}

export async function routeQuestion(
  q: string,
): Promise<{ kind: "qa" | "service" | "nomatch"; id: string }> {
  let id: string | null = null;
  if (isEmbeddingsEnabled()) id = await semanticRoute(q);
  if (!id) id = matchQA(q);
  if (id.startsWith("svc-")) return { kind: "service", id };
  if (id === "nomatch") return { kind: "nomatch", id };
  return { kind: "qa", id };
}
