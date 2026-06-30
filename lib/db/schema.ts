import {
  pgTable,
  text,
  integer,
  boolean,
  jsonb,
  doublePrecision,
  customType,
} from "drizzle-orm/pg-core";
import type {
  SourceStatus,
  Kpi,
  Bar,
  TrendPoint,
  CapitoloRow,
  ContrattoRow,
  Sindaco,
  Assessore,
  Candidato,
  Lista,
  ConsiglieriLista,
  DomainChart,
  GraphNodeSeed,
  GraphCluster,
  Relation,
} from "@/lib/model/types";

// pgvector column type (extension created by the 0000 migration).
const vector = customType<{ data: number[]; driverData: string; config: { dim: number } }>({
  dataType(config) {
    return `vector(${config?.dim ?? 1536})`;
  },
  toDriver(value) {
    return `[${value.join(",")}]`;
  },
  fromDriver(value) {
    return (value as string).replace(/^\[|\]$/g, "").split(",").map(Number);
  },
});

export const sources = pgTable("sources", {
  id: text("id").primaryKey(),
  short: text("short").notNull(),
  full: text("full").notNull(),
  icon: text("icon").notNull(),
  what: text("what").notNull(),
  url: text("url").notNull(),
  license: text("license").notNull(),
  format: text("format").notNull(),
  retrieved: text("retrieved").notNull(),
  observed: text("observed").notNull(),
  rows: text("rows").notNull(),
  hash: text("hash"),
  status: text("status").$type<SourceStatus>().notNull(),
  refresh: text("refresh").notNull(),
});

export const entities = pgTable("entities", {
  id: text("id").primaryKey(),
  typeLabel: text("type_label").notNull(),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  sources: jsonb("sources").$type<string[]>().notNull(),
});

export const navItems = pgTable("nav_items", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  icon: text("icon").notNull(),
  count: text("count").notNull(),
  ord: integer("ord").notNull(),
});

export const suggested = pgTable("suggested", {
  id: text("id").primaryKey(),
  kind: text("kind").$type<"civica" | "servizio">().notNull(),
  icon: text("icon").notNull(),
  q: text("q").notNull(),
  ord: integer("ord").notNull(),
});

export const domainCards = pgTable("domain_cards", {
  slug: text("slug").primaryKey(),
  icon: text("icon").notNull(),
  name: text("name").notNull(),
  value: text("value").notNull(),
  sub: text("sub").notNull(),
  sourceId: text("source_id").notNull(),
  srcVal: text("src_val").notNull(),
  srcTag: text("src_tag").notNull(),
  status: text("status").$type<SourceStatus>().notNull(),
  full: boolean("full").notNull().default(false),
  ord: integer("ord").notNull(),
});

export const domainDetails = pgTable("domain_details", {
  slug: text("slug").primaryKey(),
  icon: text("icon").notNull(),
  title: text("title").notNull(),
  sub: text("sub").notNull(),
  kind: text("kind").$type<"full" | "skeleton">().notNull(),
  kpis: jsonb("kpis").$type<Kpi[]>().notNull(),
  chart: jsonb("chart").$type<DomainChart | null>(),
  sources: jsonb("sources").$type<string[]>().notNull(),
  cta: jsonb("cta").$type<{ label: string; entityId: string } | null>(),
});

export const bilancio = pgTable("bilancio", {
  id: text("id").primaryKey(), // 'default'
  kpis: jsonb("kpis").$type<Kpi[]>().notNull(),
  missioni: jsonb("missioni").$type<Bar[]>().notNull(),
  trend: jsonb("trend").$type<TrendPoint[]>().notNull(),
  capitoli: jsonb("capitoli").$type<CapitoloRow[]>().notNull(),
});

export const appalti = pgTable("appalti", {
  id: text("id").primaryKey(), // 'default'
  kpis: jsonb("kpis").$type<Kpi[]>().notNull(),
  operatori: jsonb("operatori").$type<Bar[]>().notNull(),
  uffici: jsonb("uffici").$type<Bar[]>().notNull(),
  contratti: jsonb("contratti").$type<ContrattoRow[]>().notNull(),
});

export const organigramma = pgTable("organigramma", {
  id: text("id").primaryKey(), // 'default'
  sindaco: jsonb("sindaco").$type<Sindaco>().notNull(),
  assessori: jsonb("assessori").$type<Assessore[]>().notNull(),
  settori: jsonb("settori").$type<string[]>().notNull(),
  presidente: text("presidente").notNull(),
});

export const elezione = pgTable("elezione", {
  id: text("id").primaryKey(), // 'default'
  data: text("data").notNull(),
  affluenza: text("affluenza").notNull(),
  tipo: text("tipo").notNull(),
  candidati: jsonb("candidati").$type<Candidato[]>().notNull(),
  liste: jsonb("liste").$type<Lista[]>().notNull(),
  consiglieri: jsonb("consiglieri").$type<ConsiglieriLista[]>().notNull(),
  presidente: text("presidente").notNull(),
});

export const qa = pgTable("qa", {
  id: text("id").primaryKey(),
  question: text("question").notNull(),
  entityIds: jsonb("entity_ids").$type<string[]>().notNull(),
  sourceIds: jsonb("source_ids").$type<string[]>().notNull(),
  sql: text("sql").notNull(),
  body: text("body").$type<"giunta" | "bilancio" | "appalti" | "pnrr" | "demografia" | "nomatch">().notNull(),
});

export const services = pgTable("services", {
  id: text("id").primaryKey(),
  question: text("question").notNull(),
  nome: text("nome").notNull(),
  icona: text("icona").notNull(),
  ufficio: text("ufficio").notNull(),
  sintesi: text("sintesi").notNull(),
  comeFare: jsonb("come_fare").$type<string[]>().notNull(),
  cosaServe: jsonb("cosa_serve").$type<string[]>().notNull(),
  dove: text("dove").notNull(),
  quando: text("quando").notNull(),
  costo: text("costo").notNull(),
  tempi: text("tempi").notNull(),
  online: jsonb("online").$type<{ label: string; url: string }>().notNull(),
  sourceId: text("source_id").notNull(),
  fonteVal: text("fonte_val").notNull(),
});

export const documents = pgTable("documents", {
  id: text("id").primaryKey(),
  tipo: text("tipo").notNull(),
  n: text("n").notNull(),
  title: text("title").notNull(),
  date: text("date").notNull(),
  uff: text("uff").notNull(),
  sez: text("sez").notNull(),
  tags: jsonb("tags").$type<string[]>().notNull(),
  hash: text("hash"),
  sourceId: text("source_id").notNull(),
});

export const docSections = pgTable("doc_sections", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  count: text("count").notNull(),
  kind: text("kind").$type<"trasparente" | "albo">().notNull(),
  ord: integer("ord").notNull(),
});

export const mapLayers = pgTable("map_layers", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  count: text("count").notNull(),
  color: text("color").notNull(),
  colorHex: text("color_hex").notNull(),
  icon: text("icon").notNull(),
  ord: integer("ord").notNull(),
});

export const mapMarkers = pgTable("map_markers", {
  id: text("id").primaryKey(),
  layer: text("layer").notNull(),
  lat: doublePrecision("lat").notNull(),
  lon: doublePrecision("lon").notNull(),
  label: text("label").notNull(),
  type: text("type").notNull(),
  entityId: text("entity_id"),
  sourceId: text("source_id"),
});

export const graphTypes = pgTable("graph_types", {
  id: text("id").primaryKey(),
  label: text("label").notNull(),
  count: text("count").notNull(),
  color: text("color").notNull(),
  ord: integer("ord").notNull(),
});

export const graphModel = pgTable("graph_model", {
  id: text("id").primaryKey(), // 'default'
  center: jsonb("center").$type<GraphNodeSeed>().notNull(),
  clusters: jsonb("clusters").$type<GraphCluster[]>().notNull(),
  cross: jsonb("cross").$type<Relation[]>().notNull(),
});

export const embeddings = pgTable("embeddings", {
  id: text("id").primaryKey(),
  ownerType: text("owner_type").$type<"qa" | "service" | "document" | "entity">().notNull(),
  ownerId: text("owner_id").notNull(),
  content: text("content").notNull(),
  embedding: vector("embedding", { dim: 1536 }),
});
