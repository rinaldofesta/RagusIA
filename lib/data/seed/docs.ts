// Transcribed verbatim from design/reference/Ragusia.dc.html
// docs: lines ~1440–1453 · docSections: lines ~1454–1463
// alboCats: lines ~1464–1469 · docSuggested: line ~1470
import type { DocItem, DocSection } from "@/lib/model/types";

export const docs: DocItem[] = [
  { id: "d1", tipo: "Delibera di Giunta", n: "G.C. 142/2024", title: "Approvazione del bilancio di previsione 2024", date: "28/02/2024", uff: "Giunta comunale", sez: "Bilanci", tags: ["at-bilanci", "albo-giunta"], hash: "a3f1c9b7e2d4", sourceId: "atto" },
  { id: "d2", tipo: "Delibera di Giunta", n: "G.C. 156/2024", title: "Variazione di bilancio — fondi PNRR", date: "14/03/2024", uff: "Giunta comunale", sez: "Bilanci", tags: ["at-bilanci", "albo-giunta"], hash: "7e2d4486f1ac", sourceId: "atto" },
  { id: "d3", tipo: "Delibera di Consiglio", n: "C.C. 31/2024", title: "Approvazione del rendiconto 2023", date: "30/04/2024", uff: "Consiglio comunale", sez: "Bilanci", tags: ["at-bilanci", "albo-consiglio"], hash: "02e7b9d5f308", sourceId: "atto" },
  { id: "d4", tipo: "Determina dirigenziale", n: "Det. 412/2025", title: "Aggiudicazione manutenzione strade urbane", date: "18/04/2025", uff: "Settore VI — Lavori Pubblici", sez: "Bandi di gara e contratti", tags: ["at-bandi", "albo-determine"], hash: "9a2f7c1b04de", sourceId: "atto" },
  { id: "d5", tipo: "Determina dirigenziale", n: "Det. 388/2026", title: "Affidamento servizio raccolta differenziata", date: "10/01/2026", uff: "Settore IV — Ambiente", sez: "Bandi di gara e contratti", tags: ["at-bandi", "albo-determine"], hash: "8e1d5520af33", sourceId: "atto" },
  { id: "d6", tipo: "Ordinanza sindacale", n: "Ord. 22/2025", title: "Disciplina della balneazione a Marina di Ragusa", date: "02/06/2025", uff: "Sindaco", sez: "Provvedimenti", tags: ["at-provvedimenti", "albo-ordinanze"], hash: "c7a6e3b1d590", sourceId: "atto" },
  { id: "d7", tipo: "Bando di gara", n: "Gara 2025/14", title: "Riqualificazione del lungomare di Marina di Ragusa", date: "11/2025", uff: "Settore VI — Lavori Pubblici", sez: "Bandi di gara e contratti", tags: ["at-bandi", "at-opere"], hash: null, sourceId: "anac" },
  { id: "d8", tipo: "Avviso", n: "Org. 2026", title: "Organigramma, responsabili e domicili digitali", date: "06/2026", uff: "Settore I — Affari Generali", sez: "Organizzazione", tags: ["at-organizzazione", "at-personale"], hash: null, sourceId: "indicepa" },
  { id: "d9", tipo: "Delibera di Giunta", n: "G.C. 98/2024", title: "Programma triennale opere pubbliche 2024–2026", date: "20/02/2024", uff: "Giunta comunale", sez: "Opere pubbliche", tags: ["at-opere", "albo-giunta"], hash: "5f2e8810c701", sourceId: "atto" },
  { id: "d10", tipo: "Determina dirigenziale", n: "Det. 540/2025", title: "Liquidazione fornitura arredi scolastici", date: "09/2025", uff: "Settore III — Servizi Sociali", sez: "Pagamenti", tags: ["at-pagamenti", "albo-determine"], hash: "4d11c7a6e3b1", sourceId: "atto" },
  { id: "d11", tipo: "Decreto sindacale", n: "Decr. 7/2023", title: "Nomina della giunta comunale — mandato 2023", date: "15/06/2023", uff: "Sindaco", sez: "Organizzazione", tags: ["at-organizzazione", "at-personale"], hash: "b3f1c9a7e2d4", sourceId: "atto" },
  { id: "d12", tipo: "Delibera di Consiglio", n: "C.C. 12/2024", title: "Approvazione del DUP 2024–2026", date: "15/01/2024", uff: "Consiglio comunale", sez: "Bilanci", tags: ["at-bilanci", "albo-consiglio"], hash: "1ac02e7b9d5f", sourceId: "atto" },
];

export const docSections: DocSection[] = [
  { id: "at-organizzazione", label: "Organizzazione", count: "142" },
  { id: "at-personale", label: "Personale", count: "318" },
  { id: "at-bandi", label: "Bandi di gara e contratti", count: "891" },
  { id: "at-provvedimenti", label: "Provvedimenti", count: "1.204" },
  { id: "at-bilanci", label: "Bilanci", count: "156" },
  { id: "at-opere", label: "Opere pubbliche", count: "203" },
  { id: "at-pagamenti", label: "Pagamenti", count: "612" },
  { id: "at-ambiente", label: "Ambiente", count: "184" },
];

export const alboCats: DocSection[] = [
  { id: "albo-giunta", label: "Delibere di giunta", count: "612" },
  { id: "albo-consiglio", label: "Delibere di consiglio", count: "188" },
  { id: "albo-determine", label: "Determine", count: "2.140" },
  { id: "albo-ordinanze", label: "Ordinanze", count: "162" },
];

export const docSuggested: string[] = [
  "delibere di giunta sul bilancio 2024",
  "determine Settore VI",
  "ordinanze balneazione",
];
