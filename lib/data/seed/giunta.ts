// Transcribed verbatim from design/reference/Ragusia.dc.html
// giunta: lines ~1230–1244 · presidente: line ~1276 (elezione.presidente)
import type { Organigramma } from "@/lib/model/types";

export const organigramma: Organigramma = {
  sindaco: { nome: "Giuseppe «Peppe» Cassì", ruolo: "Sindaco", bio: "Avvocato · 2º mandato dal 2023", deleghe: "Cultura · Turismo · Eventi · Unesco · Avvocatura", lista: "Peppe Cassì’ndaco Ragusa 2023" },
  assessori: [
    { nome: "Gianni Giuffrida", ruolo: "Vicesindaco", deleghe: "Lavori pubblici, Urbanistica, Edilizia privata, Infrastrutture, Servizi tecnologici", vice: true },
    { nome: "Giovanni Iacono", ruolo: "Assessore", deleghe: "Bilancio, Tributi, Sanità, Protezione civile, Università e Ricerca, Sviluppo di comunità" },
    { nome: "Giorgio Massari", ruolo: "Assessore", deleghe: "Sviluppo economico, Agricoltura, Politiche agroalimentari ed euromediterranee, Affari generali" },
    { nome: "Elvira Adamo", ruolo: "Assessora", deleghe: "Inclusione, Servizi sociali, Pari opportunità" },
    { nome: "Mario D’Asta", ruolo: "Assessore", deleghe: "Ambiente, Verde pubblico, Decoro, Transizione ecologica, Servizi cimiteriali" },
    { nome: "Simone Digrandi", ruolo: "Assessore", deleghe: "Sport, Politiche giovanili, Transizione digitale, Innovazione" },
    { nome: "Andrea Distefano", ruolo: "Assessore", deleghe: "Frazioni e contrade, Tutela animali" },
    { nome: "Giovanni Gurrieri", ruolo: "Assessore", deleghe: "Centri storici, Mobilità, Polizia Municipale" },
    { nome: "Catia Pasta", ruolo: "Assessora", deleghe: "Pubblica istruzione, Scuole, Edilizia scolastica, Personale" },
  ],
  settori: [
    "I — Affari Generali",
    "II — Bilancio e Finanze",
    "III — Servizi Sociali",
    "IV — Ambiente e Igiene",
    "V — Cultura e Turismo",
    "VI — Lavori Pubblici",
    "VII — Urbanistica",
    "VIII — Polizia Municipale",
    "IX — Sviluppo Economico",
    "X — Pubblica Istruzione",
    "XI — Patrimonio",
  ],
  presidente: "Fabrizio Ilardo",
};
