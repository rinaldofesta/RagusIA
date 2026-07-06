// The repository is the ONLY data boundary the UI may import. It reads the
// object model from Postgres (Drizzle) and returns typed model objects. No
// surface imports seed JSON, Drizzle tables, or adapters directly.

import { cache } from "react";
import { eq, inArray, sql as dsql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import * as t from "@/lib/db/schema";
import { buildGraph } from "@/lib/graph/layout";
import { graphColors } from "@/lib/data/seed/graph";
import { matchQA, isAnalytic, docTokens, docMatches } from "@/lib/search/matcher";
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

/** Throw a clear, actionable error when a singleton 'default' row is missing,
 *  instead of letting a downstream `row.foo` deref crash with a cryptic
 *  TypeError → 500. Signals "database not seeded". */
function required<T>(row: T | undefined, what: string): T {
  if (!row) throw new Error(`[repository] ${what} non inizializzato — esegui \`pnpm seed\``);
  return row;
}

/** Parse 'dd/mm/yyyy hh:mm' (Italian) into an epoch for comparison; 0 if unparseable. */
function parseItDateTime(s: string): number {
  const m = /(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/.exec(s);
  if (!m) return 0;
  const [, dd, mm, yyyy, hh, min] = m;
  return Date.UTC(+yyyy, +mm - 1, +dd, +hh, +min);
}

// Sortable timestamp from the 'dd/mm/yyyy hh:mm' text column, guarded so a
// malformed/legacy ran_at can't make to_timestamp() raise (sorts last instead).
const RANAT_TS = dsql`case when ${t.ingestRuns.ranAt} ~ '^[0-9]{2}/[0-9]{2}/[0-9]{4} [0-9]{2}:[0-9]{2}$' then to_timestamp(${t.ingestRuns.ranAt}, 'DD/MM/YYYY HH24:MI') else null end`;

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
  // ran_at is 'dd/mm/yyyy hh:mm' text — order by the parsed timestamp, not the
  // lexicographic string (which scrambles order across month boundaries).
  const byTime = dsql`${RANAT_TS} DESC NULLS LAST`;
  const rows = sourceId
    ? await db.select().from(t.ingestRuns).where(eq(t.ingestRuns.sourceId, sourceId)).orderBy(byTime).limit(limit)
    : await db.select().from(t.ingestRuns).orderBy(byTime).limit(limit);
  return rows.map((r) => ({
    sourceId: r.sourceId, ranAt: r.ranAt, status: r.status, rows: r.rows,
    prevRows: r.prevRows, delta: r.delta, guard: r.guard, note: r.note,
  }));
}

// ---------- Sources / provenance ----------
// Read-only getters on the sidebar/registry hot path are wrapped in React
// cache() for per-request dedup: the shell layout (sidebar) and the page both
// read these on every navigation, and they only change at `pnpm ingest` time.
export const getSources = cache(async (): Promise<Source[]> => {
  return db.select().from(t.sources);
});
export const getSource = cache(async (id: string): Promise<Source | null> => {
  const [row] = await db.select().from(t.sources).where(eq(t.sources.id, id));
  return row ?? null;
});
/** Sources for a list of ids, one query (WHERE id IN …), in the given order. */
export async function getSourcesByIds(ids: string[]): Promise<Source[]> {
  if (!ids.length) return [];
  const rows = await db.select().from(t.sources).where(inArray(t.sources.id, ids));
  const byId = new Map(rows.map((s) => [s.id, s]));
  return ids.map((id) => byId.get(id)).filter((s): s is Source => !!s);
}
export const getFontiRegistry = cache(async (): Promise<Source[]> => {
  const all = await getSources();
  const byId = new Map(all.map((s) => [s.id, s]));
  return FONTI_ORDER.map((id) => byId.get(id)).filter((s): s is Source => !!s);
});
/** The app's global "ultimo refresh" claim: the most recent successful ingest
 *  run if any, else the newest seed refresh timestamp. Formatted 'dd/mm hh:mm'. */
async function latestRefresh(fonti: Source[]): Promise<string> {
  const [run] = await db
    .select({ ranAt: t.ingestRuns.ranAt })
    .from(t.ingestRuns)
    .where(eq(t.ingestRuns.status, "ok"))
    .orderBy(dsql`${RANAT_TS} DESC NULLS LAST`)
    .limit(1);
  const pick =
    run?.ranAt ??
    [...fonti].map((s) => s.refresh).sort((a, b) => parseItDateTime(b) - parseItDateTime(a))[0];
  if (!pick) return "—";
  const m = /(\d{2}\/\d{2})\/\d{4}\s+(\d{2}:\d{2})/.exec(pick);
  return m ? `${m[1]} ${m[2]}` : pick;
}

export const getSourceHealth = cache(async (): Promise<SourceHealth> => {
  const list = await getFontiRegistry();
  const warn = list.filter((s) => s.status === "warn");
  return {
    total: list.length,
    ok: list.filter((s) => s.status === "ok").length,
    warn: warn.length,
    lastRefresh: await latestRefresh(list),
    atRisk: warn.map((s) => s.short),
  };
});

// ---------- Entities ----------
export const getEntity = cache(async (id: string): Promise<Entity | null> => {
  const [row] = await db.select().from(t.entities).where(eq(t.entities.id, id));
  return row ?? null;
});
/** Entities for a list of ids, one query (WHERE id IN …), in the given order. */
export async function getEntitiesByIds(ids: string[]): Promise<Entity[]> {
  if (!ids.length) return [];
  const rows = await db.select().from(t.entities).where(inArray(t.entities.id, ids));
  const byId = new Map(rows.map((e) => [e.id, e]));
  return ids.map((id) => byId.get(id)).filter((e): e is Entity => !!e);
}
export async function getEntitySources(id: string): Promise<Source[]> {
  const ent = await getEntity(id);
  return ent ? getSourcesByIds(ent.sources) : [];
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
export const getNav = cache(async (): Promise<NavItem[]> => {
  const rows = await db.select().from(t.navItems).orderBy(t.navItems.ord);
  return rows.map(({ id, label, icon, count }) => ({ id, label, icon, count }));
});
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
  const row = required((await db.select().from(t.bilancio).where(eq(t.bilancio.id, "default")))[0], "bilancio");
  return { kpis: row.kpis, missioni: row.missioni, trend: row.trend, capitoli: row.capitoli };
}
export async function getAppalti(): Promise<AppaltiData> {
  const row = required((await db.select().from(t.appalti).where(eq(t.appalti.id, "default")))[0], "appalti");
  return { kpis: row.kpis, operatori: row.operatori, uffici: row.uffici, contratti: row.contratti };
}
export async function getOrganigramma(): Promise<Organigramma> {
  const row = required((await db.select().from(t.organigramma).where(eq(t.organigramma.id, "default")))[0], "organigramma");
  return { sindaco: row.sindaco, assessori: row.assessori, settori: row.settori, presidente: row.presidente };
}
export async function getElezione(): Promise<Elezione> {
  const row = required((await db.select().from(t.elezione).where(eq(t.elezione.id, "default")))[0], "elezione");
  return {
    data: row.data, affluenza: row.affluenza, tipo: row.tipo,
    candidati: row.candidati, liste: row.liste, consiglieri: row.consiglieri, presidente: row.presidente,
  };
}

// ---------- Esplora (graph) ----------
export async function getGraph(): Promise<{ nodes: GraphNode[]; links: GraphLink[]; types: GraphTypeMeta[]; W: number; H: number }> {
  const [modelRows, typeRows] = await Promise.all([
    db.select().from(t.graphModel).where(eq(t.graphModel.id, "default")),
    db.select().from(t.graphTypes).orderBy(t.graphTypes.ord),
  ]);
  const model = required(modelRows[0], "graph_model");
  const { nodes, links, W, H } = buildGraph(
    { center: model.center, clusters: model.clusters, cross: model.cross },
    graphColors,
  );
  const types = typeRows.map(({ id, label, count, color }) => ({ id, label, count, color }));
  return { nodes, links, types, W, H };
}

// ---------- Mappa ----------
export async function getMap(): Promise<{ layers: MapLayer[]; markers: MapMarker[] }> {
  const [layers, markerRows] = await Promise.all([
    db.select().from(t.mapLayers).orderBy(t.mapLayers.ord),
    db.select().from(t.mapMarkers),
  ]);
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

// Max cosine distance (pgvector `<=>`, 0=identical … 2=opposite) for a curated
// answer to "win". Above it, the question is off-topic for every QA/service, so
// we return null → the keyword matcher / NL→SQL engine handle it instead of
// forcing a confidently-wrong nearest card.
const SEMANTIC_MAX_DISTANCE = 0.5;

async function semanticRoute(q: string): Promise<string | null> {
  try {
    const vec = await embedText(q);
    if (!vec) return null;
    const lit = `[${vec.join(",")}]`;
    const rows = await db.execute(
      dsql`select owner_id, (embedding <=> ${lit}::vector) as dist from ${t.embeddings} where owner_type in ('qa','service') order by embedding <=> ${lit}::vector limit 1`,
    );
    const top = (rows as unknown as { owner_id?: string; dist?: number | string }[])[0];
    if (!top?.owner_id || top.dist == null || Number(top.dist) > SEMANTIC_MAX_DISTANCE) return null;
    return top.owner_id;
  } catch {
    return null;
  }
}

export async function routeQuestion(
  q: string,
): Promise<{ kind: "qa" | "service" | "nomatch"; id: string; analytic: boolean }> {
  let id: string | null = null;
  if (isEmbeddingsEnabled()) id = await semanticRoute(q);
  if (!id) id = matchQA(q);
  // A specific/analytic question should try the SQL engine before its curated
  // topic answer (the page uses this to prefer NL→SQL, falling back to the QA).
  const analytic = isAnalytic(q);
  if (id.startsWith("svc-")) return { kind: "service", id, analytic: false };
  if (id === "nomatch") return { kind: "nomatch", id, analytic };
  return { kind: "qa", id, analytic };
}
