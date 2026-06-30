// Transcribed verbatim from design/reference/Ragusia.dc.html
// mapLayers: lines ~1416–1423 · mapMarkers: lines ~1424–1439
import type { MapLayer, MapMarker } from "@/lib/model/types";

export const mapLayers: MapLayer[] = [
  { id: "quartieri", label: "Quartieri", count: "2", color: "var(--amber)", colorHex: "#C8841F", icon: "ph-castle-turret" },
  { id: "frazioni", label: "Frazioni", count: "2", color: "var(--teal)", colorHex: "#2E8A98", icon: "ph-map-pin" },
  { id: "opere", label: "Opere / cantieri", count: "47", color: "var(--terra)", colorHex: "#D5764E", icon: "ph-hard-hat" },
  { id: "scuole", label: "Scuole", count: "35", color: "var(--olive)", colorHex: "#A6A24E", icon: "ph-graduation-cap" },
  { id: "biblioteche", label: "Biblioteche", count: "15", color: "var(--plum)", colorHex: "#A06B7C", icon: "ph-books" },
  { id: "balneazione", label: "Balneazione", count: "12", color: "var(--sky)", colorHex: "#6FA3BC", icon: "ph-waves" },
];

export const mapMarkers: MapMarker[] = [
  { id: "m-superiore", layer: "quartieri", lat: 36.9270, lon: 14.7250, label: "Ragusa Superiore", type: "Quartiere", entityId: "ente-ragusa" },
  { id: "m-ibla", layer: "quartieri", lat: 36.9255, lon: 14.7445, label: "Ragusa Ibla", type: "Quartiere · UNESCO", entityId: "ente-ragusa" },
  { id: "m-marina", layer: "frazioni", lat: 36.7865, lon: 14.5540, label: "Marina di Ragusa", type: "Frazione costiera", entityId: "ente-ragusa" },
  { id: "m-sangiacomo", layer: "frazioni", lat: 36.8665, lon: 14.6395, label: "San Giacomo", type: "Frazione", entityId: "ente-ragusa" },
  { id: "m-opera1", layer: "opere", lat: 36.7838, lon: 14.5528, label: "Lungomare Marina", type: "Opera · in corso", entityId: "opera-lungomare" },
  { id: "m-opera2", layer: "opere", lat: 36.9262, lon: 14.7438, label: "Riqualificazione Ibla", type: "Opera · conclusa", entityId: "opera-lungomare" },
  { id: "m-opera3", layer: "opere", lat: 36.9228, lon: 14.7188, label: "Efficientam. scuole", type: "Opera · in corso", entityId: "op-edilsud" },
  { id: "m-scuola1", layer: "scuole", lat: 36.9300, lon: 14.7278, label: "I.C. «Quasimodo»", type: "Scuola", sourceId: "mim" },
  { id: "m-scuola2", layer: "scuole", lat: 36.9214, lon: 14.7332, label: "Liceo «Fermi»", type: "Scuola", sourceId: "mim" },
  { id: "m-scuola3", layer: "scuole", lat: 36.9186, lon: 14.7152, label: "I.C. «Berlinguer»", type: "Scuola", sourceId: "mim" },
  { id: "m-bib1", layer: "biblioteche", lat: 36.9268, lon: 14.7420, label: "Biblioteca Ibla", type: "Biblioteca", sourceId: "iccu" },
  { id: "m-bib2", layer: "biblioteche", lat: 36.9288, lon: 14.7256, label: "Biblioteca comunale", type: "Biblioteca", sourceId: "iccu" },
  { id: "m-baln1", layer: "balneazione", lat: 36.7820, lon: 14.5498, label: "Marina — Punta", type: "Sito balneazione", sourceId: "ispra" },
  { id: "m-baln2", layer: "balneazione", lat: 36.7775, lon: 14.5085, label: "Maganuco", type: "Sito balneazione", sourceId: "ispra" },
];
