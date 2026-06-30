// Transcribed verbatim from design/reference/Ragusia.dc.html
// suggested: lines ~1122–1128 · suggestedServizi: lines ~1526–1532
import type { SuggestedQuestion } from "@/lib/model/types";

export const suggested: SuggestedQuestion[] = [
  { id: "giunta", icon: "ph-users-three", q: "Chi compone la giunta Cassì?" },
  { id: "bilancio", icon: "ph-scales", q: "Quanto vale il bilancio 2024 per missione?" },
  { id: "appalti", icon: "ph-gavel", q: "Chi ha vinto più appalti sopra i 40k?" },
  { id: "pnrr", icon: "ph-flag-banner", q: "Quanti progetti PNRR sono attivi e su quali missioni?" },
  { id: "demografia", icon: "ph-users", q: "Quanti residenti ha Ragusa e quanti stranieri?" },
];

export const suggestedServizi: SuggestedQuestion[] = [
  { id: "svc-cie", icon: "ph-identification-card", q: "Dove faccio la carta d’identità?" },
  { id: "svc-certificati", icon: "ph-files", q: "Dove richiedo lo stato di famiglia?" },
  { id: "svc-matrimonio", icon: "ph-heart", q: "Pubblicazioni di matrimonio?" },
  { id: "svc-residenza", icon: "ph-house-line", q: "Come cambio la residenza?" },
  { id: "svc-tari", icon: "ph-recycle", q: "Come pago la TARI?" },
];
