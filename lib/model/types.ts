// RagusIA object model — the typed contract shared by the repository, the UI,
// and the future live source adapters. Field names follow the design
// (Ragusia.dc.html), renaming design `ent`→`entityId`, `src`→`sourceId`.

export type SourceStatus = "ok" | "warn";

export interface Source {
  id: string;
  short: string;
  full: string;
  icon: string;
  what: string;
  url: string;
  license: string;
  format: string;
  retrieved: string;
  observed: string;
  rows: string;
  hash: string | null;
  status: SourceStatus;
  refresh: string;
}

export interface ProvenanceRef {
  sourceId: string;
  what?: string;
  observed?: string;
  status?: SourceStatus;
}

export interface Entity {
  id: string;
  typeLabel: string;
  name: string;
  icon: string;
  sources: string[];
}

export interface Relation {
  from: string;
  to: string;
  label: string;
  dashed?: boolean;
}

// ---- generic dataset shapes ----
export interface Kpi {
  label: string;
  value: string;
  sub: string;
  sourceId?: string;
  srcVal?: string;
  srcTag?: string;
  status?: SourceStatus;
  est?: boolean;
}

export interface Bar {
  label: string;
  value: string;
  sub?: string;
  pct: number;
  color: string;
  entityId?: string;
  code?: string;
}

// ---- Domini ----
export interface DomainCard {
  slug: string; // design id minus the "dom-" prefix
  icon: string;
  name: string;
  value: string;
  sub: string;
  sourceId: string;
  srcVal: string;
  srcTag: string;
  status: SourceStatus;
  full?: boolean;
}

export interface DomainChart {
  title: string;
  srcTag: string;
  sourceId: string;
  srcVal: string;
  bars: Bar[];
}

export interface DomainDetail {
  slug: string;
  icon: string;
  title: string;
  sub: string;
  kind: "full" | "skeleton";
  kpis: Kpi[];
  chart?: DomainChart;
  sources: string[];
  cta?: { label: string; entityId: string } | null;
}

// ---- Bilancio ----
export interface TrendPoint {
  y: string;
  v: number;
}
export interface CapitoloRow {
  code: string;
  desc: string;
  miss: string;
  imp: string;
  uff: string;
}
export interface BilancioData {
  kpis: Kpi[];
  missioni: Bar[];
  trend: TrendPoint[];
  capitoli: CapitoloRow[];
}

// ---- Appalti ----
export interface ContrattoRow {
  cig: string;
  ogg: string;
  imp: string;
  op: string;
  entityId: string;
  uff: string;
  data: string;
}
export interface AppaltiData {
  kpis: Kpi[];
  operatori: Bar[];
  uffici: Bar[];
  contratti: ContrattoRow[];
}

// ---- Organigramma ----
export interface Sindaco {
  nome: string;
  ruolo: string;
  bio: string;
  deleghe: string;
  lista: string;
}
export interface Assessore {
  nome: string;
  ruolo: string;
  deleghe: string;
  vice?: boolean;
}
export interface Organigramma {
  sindaco: Sindaco;
  assessori: Assessore[];
  settori: string[];
  presidente: string;
}

// ---- Elezioni ----
export interface Candidato {
  nome: string;
  coal: string;
  voti: string;
  pct: number;
  pctLabel: string;
  eletto?: boolean;
  color: string;
}
export interface Lista {
  nome: string;
  voti: string;
  pct: number;
  pctLabel: string;
  color: string;
}
export interface ConsiglieriLista {
  lista: string;
  color: string;
  eletti: string;
}
export interface Elezione {
  data: string;
  affluenza: string;
  tipo: string;
  candidati: Candidato[];
  liste: Lista[];
  consiglieri: ConsiglieriLista[];
  presidente: string;
}

// ---- Chiedi ----
export type QaBody =
  | "giunta"
  | "bilancio"
  | "appalti"
  | "pnrr"
  | "demografia"
  | "nomatch";
export interface QA {
  id: string;
  question: string;
  entityIds: string[];
  sourceIds: string[];
  sql: string;
  body: QaBody;
}
export interface Service {
  id: string;
  question: string;
  nome: string;
  icona: string;
  ufficio: string;
  sintesi: string;
  comeFare: string[];
  cosaServe: string[];
  dove: string;
  quando: string;
  costo: string;
  tempi: string;
  online: { label: string; url: string };
  sourceId: string;
  fonteVal: string;
}
export interface SuggestedQuestion {
  id: string;
  icon: string;
  q: string;
}

// ---- Documenti ----
export interface DocItem {
  id: string;
  tipo: string;
  n: string;
  title: string;
  date: string;
  uff: string;
  sez: string;
  tags: string[];
  hash: string | null;
  sourceId: string;
}
export interface DocSection {
  id: string;
  label: string;
  count: string;
}

// ---- Mappa ----
export interface MapLayer {
  id: string;
  label: string;
  count: string;
  color: string;
  colorHex: string;
  icon: string;
}
export interface MapMarker {
  id: string;
  layer: string;
  lat: number;
  lon: number;
  label: string;
  type: string;
  entityId?: string;
  sourceId?: string;
}

// ---- Esplora (object graph) ----
export interface GraphTypeMeta {
  id: string;
  label: string;
  count: string;
  color: string;
}
export interface GraphNodeSeed {
  id: string;
  type: string;
  label: string;
  entityId?: string;
  serviceId?: string;
  sourceId?: string;
}
export interface GraphCluster {
  hub: GraphNodeSeed;
  leaves: GraphNodeSeed[];
}
export interface GraphModel {
  center: GraphNodeSeed;
  clusters: GraphCluster[];
  cross: Relation[];
}
export type GraphTier = "center" | "hub" | "leaf";
export interface GraphNode {
  id: string;
  cx: number;
  cy: number;
  r: number;
  tier: GraphTier;
  type: string;
  color: string;
  label: string;
  entityId?: string;
  serviceId?: string;
  sourceId?: string;
}
export interface GraphLink {
  from: string;
  to: string;
  label: string;
  dashed: boolean;
  A: GraphNode;
  B: GraphNode;
}

// ---- Misc ----
export interface SourceHealth {
  total: number;
  ok: number;
  warn: number;
  lastRefresh: string;
  atRisk: string[];
}
export interface NavItem {
  id: string;
  label: string;
  icon: string;
  count: string;
}
