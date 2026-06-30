// Transcribed verbatim from design/reference/Ragusia.dc.html
// graphTypes: lines ~1306–1325 · graphColors: line ~1327 · graphModel: lines ~1329–1391
import type { GraphModel, GraphTypeMeta } from "@/lib/model/types";

export const graphTypes: GraphTypeMeta[] = [
  { id: "organi", label: "Organi", count: "3", color: "var(--amber)" },
  { id: "uffici", label: "Uffici / Settori", count: "11", color: "var(--amber)" },
  { id: "persone", label: "Amministratori", count: "33", color: "var(--sky)" },
  { id: "atti", label: "Atti", count: "1.240", color: "var(--stone)" },
  { id: "contratti", label: "Contratti", count: "284", color: "var(--terra)" },
  { id: "operatori", label: "Operatori economici", count: "196", color: "var(--olive)" },
  { id: "opere", label: "Opere pubbliche", count: "47", color: "var(--teal)" },
  { id: "pnrr", label: "Progetti PNRR", count: "463", color: "var(--plum)" },
  { id: "capitoli", label: "Capitoli di bilancio", count: "612", color: "var(--stone)" },
  { id: "elezioni", label: "Elezioni", count: "4", color: "var(--amber)" },
  { id: "liste", label: "Liste", count: "14", color: "var(--plum)" },
  { id: "territorio", label: "Territorio", count: "6", color: "var(--sky)" },
  { id: "edifici", label: "Edifici scolastici", count: "35", color: "var(--olive)" },
  { id: "biblioteche", label: "Biblioteche", count: "15", color: "var(--terra)" },
  { id: "indicatori", label: "Indicatori", count: "38", color: "var(--teal)" },
  { id: "servizi", label: "Servizi al cittadino", count: "12", color: "#5DAE86" },
  { id: "documenti", label: "Documenti", count: "3.910", color: "var(--stone)" },
  { id: "fonti", label: "Fonti", count: "12", color: "#A89D88" },
];

export const graphColors: Record<string, string> = {
  organi: "#D89A3E",
  uffici: "#D89A3E",
  persone: "#6FA3BC",
  atti: "#B0A892",
  contratti: "#D5764E",
  operatori: "#B6B25E",
  opere: "#2E9AA6",
  pnrr: "#B07C9E",
  capitoli: "#C2A35A",
  territorio: "#6FA3BC",
  indicatori: "#46A8A8",
  servizi: "#5DAE86",
  fonti: "#9A8F78",
  edifici: "#B6B25E",
  elezioni: "#D89A3E",
  liste: "#B07C9E",
  documenti: "#B0A892",
  biblioteche: "#C58A6A",
};

export const graphModel: GraphModel = {
  center: { id: "comune", type: "organi", label: "Comune di Ragusa", entityId: "ente-ragusa" },
  clusters: [
    {
      hub: { id: "h-governo", type: "organi", label: "Giunta Cassì", entityId: "giunta" },
      leaves: [
        { id: "sindaco", type: "organi", label: "Sindaco Cassì", entityId: "sindaco-cassi" },
        { id: "vicesindaco", type: "persone", label: "Vicesind. Giuffrida", entityId: "giunta" },
        { id: "consiglio", type: "organi", label: "Consiglio · 24", entityId: "consiglio" },
        { id: "presidente", type: "persone", label: "Pres. Ilardo", entityId: "consiglio" },
      ],
    },
    {
      hub: { id: "h-settore6", type: "uffici", label: "Settore VI · LL.PP.", entityId: "settore-llpp" },
      leaves: [
        { id: "dirigente", type: "persone", label: "Dirigente", entityId: "settore-llpp" },
        { id: "det412", type: "atti", label: "Det. 412/2025", entityId: "settore-llpp" },
        { id: "lungomare", type: "opere", label: "Lungomare Marina", entityId: "opera-lungomare" },
        { id: "cap0801", type: "capitoli", label: "Cap. 0801.12", entityId: "bilancio-2024" },
      ],
    },
    {
      hub: { id: "h-appalti", type: "contratti", label: "Appalti · ANAC", entityId: "op-iblea" },
      leaves: [
        { id: "cig1", type: "contratti", label: "CIG 7C90B3E1", entityId: "op-valdinoto" },
        { id: "op-iblea", type: "operatori", label: "Iblea Costruzioni", entityId: "op-iblea" },
        { id: "op-valdinoto", type: "operatori", label: "Val di Noto", entityId: "op-valdinoto" },
        { id: "op-hyblaea", type: "operatori", label: "Hyblaea Ambiente", entityId: "op-hyblaea" },
        { id: "op-edilsud", type: "operatori", label: "Edilsud", entityId: "op-edilsud" },
      ],
    },
    {
      hub: { id: "h-bilancio", type: "capitoli", label: "Bilancio 2024", entityId: "bilancio-2024" },
      leaves: [
        { id: "m01", type: "capitoli", label: "M01 Servizi gen.", entityId: "m01" },
        { id: "m12", type: "capitoli", label: "M12 Sociali", entityId: "m12" },
        { id: "cap0905", type: "capitoli", label: "Cap. 0905.01", entityId: "bilancio-2024" },
        { id: "spesa", type: "indicatori", label: "€117,6 mln", entityId: "bilancio-2024" },
      ],
    },
    {
      hub: { id: "h-pnrr", type: "pnrr", label: "PNRR Ragusa", entityId: "pnrr-portfolio" },
      leaves: [
        { id: "pnrr-m4", type: "pnrr", label: "M4 Istruzione", entityId: "pnrr-m4" },
        { id: "pnrr-m5", type: "pnrr", label: "M5 Inclusione", entityId: "pnrr-m5" },
        { id: "pnrr-m2", type: "pnrr", label: "M2 Ecologica", entityId: "pnrr-portfolio" },
        { id: "effscuole", type: "opere", label: "Effic. scuole", entityId: "op-edilsud" },
      ],
    },
    {
      hub: { id: "h-territorio", type: "territorio", label: "Territorio", entityId: "ente-ragusa" },
      leaves: [
        { id: "superiore", type: "territorio", label: "Ragusa Superiore", entityId: "ente-ragusa" },
        { id: "ibla", type: "territorio", label: "Ragusa Ibla", entityId: "ente-ragusa" },
        { id: "marina", type: "territorio", label: "Marina di Ragusa", entityId: "ente-ragusa" },
        { id: "sangiacomo", type: "territorio", label: "San Giacomo", entityId: "ente-ragusa" },
      ],
    },
    {
      hub: { id: "h-servizi", type: "servizi", label: "Servizi al cittadino", serviceId: "svc-certificati" },
      leaves: [
        { id: "cie", type: "servizi", label: "Carta d’identità", serviceId: "svc-cie" },
        { id: "statofam", type: "servizi", label: "Stato di famiglia", serviceId: "svc-certificati" },
        { id: "matrimoni", type: "servizi", label: "Matrimoni", serviceId: "svc-matrimonio" },
        { id: "residenza", type: "servizi", label: "Residenza", serviceId: "svc-residenza" },
        { id: "tari", type: "servizi", label: "TARI", serviceId: "svc-tari" },
      ],
    },
    {
      hub: { id: "h-ambiente", type: "indicatori", label: "Ambiente", entityId: "ind-popolazione" },
      leaves: [
        { id: "rd", type: "indicatori", label: "RD 68,9%", entityId: "ind-popolazione" },
        { id: "pm10", type: "indicatori", label: "PM10 24,5", entityId: "ind-popolazione" },
        { id: "balneazione", type: "territorio", label: "12 siti balneaz.", entityId: "ente-ragusa" },
      ],
    },
    {
      hub: { id: "h-fonti", type: "fonti", label: "Fonti" },
      leaves: [
        { id: "f-anac", type: "fonti", label: "ANAC", sourceId: "anac" },
        { id: "f-bdap", type: "fonti", label: "BDAP", sourceId: "bdap" },
        { id: "f-istat", type: "fonti", label: "ISTAT", sourceId: "istat" },
        { id: "f-anpr", type: "fonti", label: "ANPR", sourceId: "anpr" },
      ],
    },
  ],
  cross: [
    { from: "lungomare", to: "pnrr-m2", label: "finanziata da" },
    { from: "cig1", to: "op-valdinoto", label: "aggiudicato a" },
    { from: "h-settore6", to: "h-appalti", label: "bandisce" },
    { from: "h-bilancio", to: "h-settore6", label: "finanzia" },
    { from: "statofam", to: "h-servizi", label: "rilascia" },
    { from: "f-anac", to: "h-appalti", label: "attesta", dashed: true },
    { from: "f-bdap", to: "h-bilancio", label: "attesta", dashed: true },
    { from: "f-istat", to: "h-territorio", label: "attesta", dashed: true },
    { from: "effscuole", to: "op-edilsud", label: "esegue" },
    { from: "sindaco", to: "h-governo", label: "guida" },
  ],
};
