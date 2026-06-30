// Transcribed verbatim from design/reference/Ragusia.dc.html (lines ~1153–1162)
// Note: the brief requested an `ord` field (array index), but `DomainCard` in
// lib/model/types.ts does not declare one. Conforming to the type exactly, so
// `ord` is omitted here; array order itself preserves the original sequence.
import type { DomainCard } from "@/lib/model/types";

export const dominiCards: DomainCard[] = [
  { slug: "organigramma", icon: "ph-tree-structure", name: "Organigramma", value: "Cassì", sub: "Sindaco · 2º mandato", sourceId: "dait", srcVal: "Governo del Comune", srcTag: "DAIT · IODL", status: "ok" },
  { slug: "bilancio", icon: "ph-scales", name: "Bilancio", value: "€117,6M", sub: "previsione 2024", sourceId: "bdap", srcVal: "Bilancio 2024", srcTag: "BDAP · oss. 2024", status: "ok", full: true },
  { slug: "appalti", icon: "ph-gavel", name: "Appalti & Contratti", value: "€44,1M", sub: "284 contratti ≥ €40k", sourceId: "anac", srcVal: "Contratti pubblici", srcTag: "ANAC · a rischio", status: "warn", full: true },
  { slug: "opere", icon: "ph-hard-hat", name: "Opere pubbliche", value: "47", sub: "cantieri e interventi", sourceId: "opencoesione", srcVal: "Opere pubbliche", srcTag: "OpenCoesione · IODL", status: "ok" },
  { slug: "pnrr", icon: "ph-flag-banner", name: "PNRR & Coesione", value: "579", sub: "463 PNRR · 116 coesione", sourceId: "openpnrr", srcVal: "Progetti PNRR e coesione", srcTag: "OpenPNRR · CC-BY", status: "ok" },
  { slug: "demografia", icon: "ph-users", name: "Demografia", value: "73.878", sub: "residenti (1/1/2025)", sourceId: "istat", srcVal: "Popolazione residente", srcTag: "ISTAT · CC-BY", status: "ok" },
  { slug: "ambiente", icon: "ph-leaf", name: "Ambiente", value: "68,9%", sub: "raccolta differenziata", sourceId: "ispra", srcVal: "Indicatori ambientali", srcTag: "ISPRA · CC-BY", status: "ok" },
  { slug: "elezioni", icon: "ph-check-square", name: "Elezioni", value: "2023", sub: "comunali · 14 liste", sourceId: "eligendo", srcVal: "Elezioni comunali 2023", srcTag: "Eligendo · 2023", status: "ok" },
];
