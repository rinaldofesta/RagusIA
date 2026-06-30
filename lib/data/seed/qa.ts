// Transcribed verbatim from design/reference/Ragusia.dc.html (lines ~1130–1142)
import type { QA } from "@/lib/model/types";

export const qaMeta: Record<string, QA> = {
  giunta: {
    id: "giunta",
    question: "Chi compone la giunta Cassì?",
    entityIds: ["sindaco-cassi", "giunta", "consiglio"],
    sourceIds: ["dait", "eligendo", "indicepa"],
    sql: "select  o.ruolo, o.nominativo, o.delega, f.fonte\nfrom    organi o\njoin    amministratori a on a.organo_id = o.id\nleft join fonti f on f.id = o.fonte_id\nwhere   o.ente_istat = '088009'\n  and   o.mandato    = '2023–2028'\norder by o.rango;",
    body: "giunta",
  },
  bilancio: {
    id: "bilancio",
    question: "Quanto vale il bilancio 2024 per missione?",
    entityIds: ["bilancio-2024", "m01", "m12"],
    sourceIds: ["bdap"],
    sql: "select  m.codice, m.missione, sum(c.stanziamento) as importo\nfrom    capitoli_bilancio c\njoin    missioni m on m.codice = c.missione\nwhere   c.ente_istat = '088009'\n  and   c.esercizio  = 2024\ngroup by m.codice, m.missione\norder by importo desc;",
    body: "bilancio",
  },
  appalti: {
    id: "appalti",
    question: "Chi ha vinto più appalti sopra i 40k?",
    entityIds: ["op-iblea", "settore-llpp"],
    sourceIds: ["anac", "indicepa"],
    sql: "select  op.denominazione, count(*) as n_contratti, sum(c.importo) as valore\nfrom    contratti c\njoin    operatori op on op.id = c.aggiudicatario\nwhere   c.ente_istat = '088009'\n  and   c.importo   >= 40000\ngroup by op.denominazione\norder by valore desc\nlimit 5;",
    body: "appalti",
  },
  pnrr: {
    id: "pnrr",
    question: "Quanti progetti PNRR sono attivi e su quali missioni?",
    entityIds: ["pnrr-portfolio", "pnrr-m4", "pnrr-m5"],
    sourceIds: ["openpnrr", "opencoesione"],
    sql: "select  p.missione, count(*) as progetti, sum(p.finanziamento) as importo\nfrom    progetti_pnrr p\nwhere   p.territorio_istat = '088009'\ngroup by p.missione\norder by progetti desc;",
    body: "pnrr",
  },
  demografia: {
    id: "demografia",
    question: "Quanti residenti ha Ragusa e quanti stranieri?",
    entityIds: ["ente-ragusa", "ind-popolazione"],
    sourceIds: ["istat"],
    sql: "select  anno, popolazione, stranieri_pct, superficie_kmq\nfrom    indicatori_demografia\nwhere   ente_istat = '088009'\norder by anno desc\nlimit 3;",
    body: "demografia",
  },
  nomatch: {
    id: "nomatch",
    question: "",
    entityIds: ["ente-ragusa"],
    sourceIds: ["istat", "anac"],
    sql: "-- nessuna query: domanda non mappata nel prototipo",
    body: "nomatch",
  },
};
