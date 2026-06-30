// Transcribed verbatim from design/reference/Ragusia.dc.html (lines ~1246–1277)
import type { Elezione } from "@/lib/model/types";

export const elezione: Elezione = {
  data: "28–29 maggio 2023",
  affluenza: "56,03%",
  tipo: "Primo turno · proporzionale · 24 seggi",
  candidati: [
    { nome: "Giuseppe «Peppe» Cassì", coal: "5 liste civiche", voti: "21.673", pct: 62.92, pctLabel: "62,92%", eletto: true, color: "var(--amber)" },
    { nome: "Riccardo Schininà", coal: "Centrosinistra · PD", voti: "6.705", pct: 19.47, pctLabel: "19,47%", color: "var(--teal)" },
    { nome: "Giovanni Cultrera", coal: "Centrodestra · FdI/FI", voti: "3.345", pct: 9.71, pctLabel: "9,71%", color: "var(--terra)" },
    { nome: "Sergio Firrincieli", coal: "Movimento 5 Stelle", voti: "2.721", pct: 7.90, pctLabel: "7,90%", color: "var(--olive)" },
  ],
  liste: [
    { nome: "Peppe Cassì’ndaco Ragusa 2023", voti: "7.789", pct: 24.48, pctLabel: "24,48%", color: "var(--amber)" },
    { nome: "Partecipiamo Ragusa Futura", voti: "3.951", pct: 12.42, pctLabel: "12,42%", color: "var(--amber)" },
    { nome: "Ragusa Prossima", voti: "2.340", pct: 7.35, pctLabel: "7,35%", color: "var(--amber)" },
    { nome: "Ragusa Terra Madre", voti: "2.333", pct: 7.33, pctLabel: "7,33%", color: "var(--amber)" },
    { nome: "Fratelli d’Italia", voti: "2.099", pct: 6.60, pctLabel: "6,60%", color: "var(--terra)" },
    { nome: "De Luca per Ragusa", voti: "1.790", pct: 5.63, pctLabel: "5,63%", color: "var(--amber)" },
    { nome: "Movimento 5 Stelle 2050", voti: "1.651", pct: 5.19, pctLabel: "5,19%", color: "var(--olive)" },
    { nome: "Territorio", voti: "1.649", pct: 5.18, pctLabel: "5,18%", color: "var(--teal)" },
    { nome: "Insieme", voti: "1.513", pct: 4.76, pctLabel: "4,76%", color: "var(--terra)" },
  ],
  consiglieri: [
    { lista: "Peppe Cassì’ndaco Ragusa 2023", color: "var(--amber)", eletti: "Gianni Giuffrida · Simone Digrandi · Federico Bennardo · Elvira Adamo · Fabrizio Ilardo · Oriana La Licata · Catia Pasta · Marco Antoci" },
    { lista: "Partito Democratico", color: "var(--teal)", eletti: "Peppe Calabrese · Mario Chiavola" },
    { lista: "Ragusa Prossima", color: "var(--amber)", eletti: "Gianni Iurato · Sebastiano Zagami" },
    { lista: "Ragusa Terra Madre", color: "var(--amber)", eletti: "Giovanni Gurrieri · Marco Galifi" },
    { lista: "Generazione Demos", color: "var(--teal)", eletti: "Gaetano Mauro · Giuseppe Podimani" },
    { lista: "Territorio", color: "var(--teal)", eletti: "Angelo La Porta" },
    { lista: "De Luca per Ragusa", color: "var(--amber)", eletti: "Saverio Buscemi" },
    { lista: "Fratelli d’Italia", color: "var(--terra)", eletti: "Rocco Bitetti" },
    { lista: "Movimento 5 Stelle 2050", color: "var(--olive)", eletti: "Sergio Firrincieli" },
  ],
  presidente: "Fabrizio Ilardo",
};
