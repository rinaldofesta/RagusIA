import Link from "next/link";
import { AnswerProse, Icon } from "@/components/primitives/kit";
import { Cite } from "@/components/primitives/provenance";
import { srcDot, srcTag, kpiValue } from "./prov";
import type { AppaltiData, Source } from "@/lib/model/types";

/** Data-driven answer prose for the appalti QA — figures come from the live ANAC CIG model. */
export function Appalti({ data, src }: { data: AppaltiData; src: Source | null }) {
  const contratti = kpiValue(data.kpis, "Contratti pubblicati");
  const valore = kpiValue(data.kpis, "Valore complessivo");
  const medio = kpiValue(data.kpis, "Importo medio");
  const uffici = kpiValue(data.kpis, "Uffici committenti");
  const periodo = src?.observed ?? "2024–2025";

  return (
    <AnswerProse>
      <p className="m-0 mb-[15px]">
        Nel periodo {periodo} il Comune ha pubblicato{" "}
        <strong className="font-semibold">{contratti} contratti</strong> (CIG), per un valore
        complessivo a base di gara di circa <strong className="font-semibold">{valore}</strong>
        <Cite
          sourceId="anac"
          what={`Contratti · ${contratti} · ${valore}`}
          dot={srcDot(src)}
          tag={srcTag(src, "CC-BY 4.0")}
        />
        .
      </p>
      <p className="m-0 mb-[15px]">
        L'importo medio è di circa <strong className="font-semibold">{medio}</strong> per contratto,
        distribuiti su <strong className="font-semibold">{uffici} uffici committenti</strong>
        <Cite
          sourceId="anac"
          what={`Importo medio · ${medio} · ${uffici} uffici`}
          dot={srcDot(src)}
          tag={srcTag(src, "CC-BY 4.0")}
        />
        .
      </p>
      <p className="m-0 mb-[14px] font-hanken text-[12.5px] leading-[1.5] font-normal text-ink-3">
        <Icon name="ph-info" className="text-[13px] align-[-1px]" /> Il dataset ANAC dei CIG non
        include l'aggiudicatario: i nomi degli operatori economici non sono ricavabili da questa
        fonte.
      </p>
      <Link
        href="/domini/appalti"
        className="inline-flex items-center gap-2 mt-[2px] bg-card border border-line-2 rounded-[10px] px-[14px] py-[9px] font-hanken text-[12.5px] font-semibold text-ink cursor-pointer transition-colors hover:border-amber hover:bg-amber-tint"
      >
        <Icon name="ph-gavel" className="text-[15px] text-amber-d" /> Apri la dashboard Appalti{" "}
        <Icon name="ph-arrow-right" className="text-[13px]" />
      </Link>
    </AnswerProse>
  );
}
