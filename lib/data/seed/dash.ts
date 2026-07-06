// Transcribed verbatim from design/reference/Ragusia.dc.html
// bilancio: lines ~1164–1197 · appalti: lines ~1198–1227
import type { AppaltiData, BilancioData } from "@/lib/model/types";

export const bilancio: BilancioData = {
  kpis: [
    { label: "Totale previsione 2024", value: "€117,6 mln", sub: "spesa complessiva", sourceId: "bdap", srcVal: "Bilancio di previsione 2024 · €117,6 mln", srcTag: "BDAP · oss. 2024", status: "ok" },
    { label: "Spesa corrente", value: "€93,1 mln", sub: "≈ 79% del totale", sourceId: "bdap", srcVal: "Spesa corrente 2024 · €93,1 mln", srcTag: "BDAP · oss. 2024", status: "ok" },
    { label: "Conto capitale", value: "€24,5 mln", sub: "investimenti · ≈ 21%", sourceId: "bdap", srcVal: "Spesa in conto capitale · €24,5 mln", srcTag: "BDAP · stima", est: true },
    { label: "Capitoli di spesa", value: "612", sub: "articolazioni di bilancio", sourceId: "bdap", srcVal: "Capitoli di bilancio 2024 · 612", srcTag: "BDAP · oss. 2024", status: "ok" },
  ],
  missioni: [
    { code: "M01", label: "Servizi istituzionali e generali", value: "€29,8M", pct: 100, color: "var(--amber)", entityId: "m01" },
    { code: "M12", label: "Diritti sociali e famiglia", value: "€18,4M", pct: 62, color: "var(--teal)", entityId: "m12" },
    { code: "M08", label: "Assetto territorio ed edilizia", value: "€13,1M", pct: 44, color: "var(--terra)", entityId: "bilancio-2024" },
    { code: "M09", label: "Sviluppo sostenibile e ambiente", value: "€12,7M", pct: 43, color: "var(--olive)", entityId: "bilancio-2024" },
    { code: "M10", label: "Trasporti e mobilità", value: "€9,9M", pct: 33, color: "var(--sky)", entityId: "bilancio-2024" },
    { code: "M04", label: "Istruzione e diritto allo studio", value: "€8,6M", pct: 29, color: "var(--plum)", entityId: "bilancio-2024" },
    { code: "M99", label: "Servizi per conto terzi", value: "€7,4M", pct: 25, color: "var(--stone)", entityId: "bilancio-2024" },
    { code: "M50", label: "Debito pubblico", value: "€4,9M", pct: 16, color: "var(--stone)", entityId: "bilancio-2024" },
    { code: "M03", label: "Ordine pubblico e sicurezza", value: "€4,2M", pct: 14, color: "var(--stone)", entityId: "bilancio-2024" },
    { code: "M05", label: "Beni e attività culturali", value: "€3,8M", pct: 13, color: "var(--stone)", entityId: "bilancio-2024" },
    { code: "M06", label: "Politiche giovanili e sport", value: "€2,7M", pct: 9, color: "var(--stone)", entityId: "bilancio-2024" },
    { code: "M14", label: "Sviluppo economico", value: "€2,1M", pct: 7, color: "var(--stone)", entityId: "bilancio-2024" },
  ],
  trend: [
    { y: "2020", v: 102.3 },
    { y: "2021", v: 108.7 },
    { y: "2022", v: 111.2 },
    { y: "2023", v: 114.9 },
    { y: "2024", v: 117.6 },
  ],
  capitoli: [
    { code: "1010.03", desc: "Stipendi e oneri del personale", miss: "M01", imp: "€21,4M", uff: "Settore I — Affari Generali" },
    { code: "1208.01", desc: "Trasferimenti per assistenza sociale", miss: "M12", imp: "€9,8M", uff: "Settore III — Servizi Sociali" },
    { code: "0901.05", desc: "Servizio raccolta e smaltimento rifiuti", miss: "M09", imp: "€8,9M", uff: "Settore IV — Ambiente" },
    { code: "0801.12", desc: "Manutenzione strade e patrimonio", miss: "M08", imp: "€6,2M", uff: "Settore VI — Lavori Pubblici" },
    { code: "1005.04", desc: "Trasporto pubblico locale", miss: "M10", imp: "€5,1M", uff: "Settore VI — Lavori Pubblici" },
    { code: "0401.07", desc: "Refezione ed edilizia scolastica", miss: "M04", imp: "€4,7M", uff: "Settore III — Servizi Sociali" },
    { code: "5001.01", desc: "Quota capitale ammortamento mutui", miss: "M50", imp: "€4,9M", uff: "Settore II — Bilancio" },
    { code: "0503.02", desc: "Valorizzazione beni culturali (Ibla)", miss: "M05", imp: "€2,4M", uff: "Settore V — Cultura" },
  ],
};

export const appalti: AppaltiData = {
  kpis: [
    { label: "Contratti pubblicati", value: "284", sub: "CIG · dal 2019", sourceId: "anac", srcVal: "Contratti · 284", srcTag: "ANAC · a rischio", status: "warn" },
    { label: "Valore complessivo", value: "€44,1 mln", sub: "importo a base di gara", sourceId: "anac", srcVal: "Valore contratti · €44,1 mln", srcTag: "ANAC · a rischio", status: "warn" },
    { label: "Importo medio", value: "€155k", sub: "per contratto", sourceId: "anac", srcVal: "Importo medio · €155k", srcTag: "ANAC · stima", est: true },
    { label: "Uffici committenti", value: "5", sub: "centri di costo", sourceId: "anac", srcVal: "Uffici committenti · 5", srcTag: "ANAC · a rischio", status: "warn" },
  ],
  operatori: [
    { label: "Iblea Costruzioni S.r.l.", value: "€4,9M", sub: "28 contratti", pct: 100, color: "var(--amber)", entityId: "op-iblea" },
    { label: "Mediterranea Servizi S.c.a.r.l.", value: "€3,7M", sub: "19 contratti", pct: 76, color: "var(--teal)", entityId: "op-mediterranea" },
    { label: "Edilsud Appalti S.r.l.", value: "€3,1M", sub: "22 contratti", pct: 63, color: "var(--terra)", entityId: "op-edilsud" },
    { label: "Hyblaea Ambiente S.p.A.", value: "€2,8M", sub: "11 contratti", pct: 57, color: "var(--olive)", entityId: "op-hyblaea" },
    { label: "Val di Noto Infrastrutture S.r.l.", value: "€2,2M", sub: "14 contratti", pct: 45, color: "var(--sky)", entityId: "op-valdinoto" },
  ],
  uffici: [
    { label: "Settore VI — Lavori Pubblici", value: "€18,2M", pct: 100, color: "var(--amber)", entityId: "settore-llpp" },
    { label: "Settore IV — Ambiente e Igiene", value: "€9,1M", pct: 50, color: "var(--teal)", entityId: "settore-llpp" },
    { label: "Settore III — Servizi Sociali", value: "€5,4M", pct: 30, color: "var(--terra)", entityId: "settore-llpp" },
    { label: "Settore II — Cultura e Turismo", value: "€4,1M", pct: 23, color: "var(--olive)", entityId: "settore-llpp" },
    { label: "Settore I — Affari Generali", value: "€3,6M", pct: 20, color: "var(--stone)", entityId: "settore-llpp" },
  ],
  contratti: [
    { cig: "9A2F7C1B04", ogg: "Manutenzione strade urbane", imp: "€480.000", op: "Iblea Costruzioni S.r.l.", entityId: "op-iblea", uff: "Settore VI", data: "04/2026" },
    { cig: "8E1D5520AF", ogg: "Servizio raccolta differenziata", imp: "€2.140.000", op: "Hyblaea Ambiente S.p.A.", entityId: "op-hyblaea", uff: "Settore IV", data: "01/2026" },
    { cig: "7C90B3E118", ogg: "Riqualificazione lungomare Marina", imp: "€1.260.000", op: "Val di Noto Infrastrutture S.r.l.", entityId: "op-valdinoto", uff: "Settore VI", data: "11/2025" },
    { cig: "6B47A0DD92", ogg: "Refezione scolastica 2025/26", imp: "€620.000", op: "Mediterranea Servizi S.c.a.r.l.", entityId: "op-mediterranea", uff: "Settore III", data: "09/2025" },
    { cig: "5F2E8810C7", ogg: "Efficientamento energetico scuole", imp: "€890.000", op: "Edilsud Appalti S.r.l.", entityId: "op-edilsud", uff: "Settore VI", data: "07/2025" },
    { cig: "4D11C7A6E3", ogg: "Manutenzione del verde pubblico", imp: "€310.000", op: "Hyblaea Ambiente S.p.A.", entityId: "op-hyblaea", uff: "Settore IV", data: "05/2025" },
  ],
};
