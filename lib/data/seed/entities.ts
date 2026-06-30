// Transcribed verbatim from design/reference/Ragusia.dc.html (lines ~1101–1120)
import type { Entity } from "@/lib/model/types";

export const entities: Record<string, Entity> = {
  "sindaco-cassi": { id: "sindaco-cassi", typeLabel: "Organo di governo", name: "Giuseppe «Peppe» Cassì", icon: "ph-user", sources: ["dait", "eligendo"] },
  giunta: { id: "giunta", typeLabel: "Organo", name: "Giunta comunale", icon: "ph-users-three", sources: ["indicepa", "dait"] },
  consiglio: { id: "consiglio", typeLabel: "Organo", name: "Consiglio comunale", icon: "ph-bank", sources: ["dait"] },
  "bilancio-2024": { id: "bilancio-2024", typeLabel: "Bilancio", name: "Bilancio di previsione 2024", icon: "ph-scales", sources: ["bdap"] },
  m01: { id: "m01", typeLabel: "Missione", name: "M01 · Servizi istituzionali", icon: "ph-buildings", sources: ["bdap"] },
  m12: { id: "m12", typeLabel: "Missione", name: "M12 · Diritti sociali e famiglia", icon: "ph-hand-heart", sources: ["bdap"] },
  "op-iblea": { id: "op-iblea", typeLabel: "Operatore economico", name: "Iblea Costruzioni S.r.l.", icon: "ph-buildings", sources: ["anac"] },
  "op-mediterranea": { id: "op-mediterranea", typeLabel: "Operatore economico", name: "Mediterranea Servizi S.c.a.r.l.", icon: "ph-buildings", sources: ["anac"] },
  "op-edilsud": { id: "op-edilsud", typeLabel: "Operatore economico", name: "Edilsud Appalti S.r.l.", icon: "ph-buildings", sources: ["anac"] },
  "op-hyblaea": { id: "op-hyblaea", typeLabel: "Operatore economico", name: "Hyblaea Ambiente S.p.A.", icon: "ph-buildings", sources: ["anac"] },
  "op-valdinoto": { id: "op-valdinoto", typeLabel: "Operatore economico", name: "Val di Noto Infrastrutture S.r.l.", icon: "ph-buildings", sources: ["anac"] },
  "opera-lungomare": { id: "opera-lungomare", typeLabel: "Opera pubblica", name: "Riqualificazione del lungomare di Marina di Ragusa", icon: "ph-hard-hat", sources: ["opencoesione", "anac"] },
  "settore-llpp": { id: "settore-llpp", typeLabel: "Settore / Ufficio", name: "Settore VI — Lavori Pubblici", icon: "ph-hard-hat", sources: ["anac", "indicepa"] },
  "pnrr-portfolio": { id: "pnrr-portfolio", typeLabel: "Portafoglio", name: "Progetti PNRR — Ragusa", icon: "ph-flag-banner", sources: ["openpnrr"] },
  "pnrr-m4": { id: "pnrr-m4", typeLabel: "Missione PNRR", name: "M4 · Istruzione e ricerca", icon: "ph-graduation-cap", sources: ["openpnrr"] },
  "pnrr-m5": { id: "pnrr-m5", typeLabel: "Missione PNRR", name: "M5 · Inclusione e coesione", icon: "ph-users-three", sources: ["openpnrr"] },
  "ente-ragusa": { id: "ente-ragusa", typeLabel: "Ente", name: "Comune di Ragusa", icon: "ph-bank", sources: ["istat", "indicepa"] },
  "ind-popolazione": { id: "ind-popolazione", typeLabel: "Indicatore", name: "Popolazione residente", icon: "ph-users", sources: ["istat"] },
};
