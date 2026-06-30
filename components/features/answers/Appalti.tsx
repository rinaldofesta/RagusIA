import Link from "next/link";
import { AnswerProse, Icon } from "@/components/primitives/kit";
import { Cite } from "@/components/primitives/provenance";

/** Bespoke answer prose for the appalti QA (design lines 176-183). */
export function Appalti() {
  return (
    <AnswerProse>
      <p className="m-0 mb-[15px]">
        Dal 2019 il Comune ha pubblicato circa{" "}
        <strong className="font-semibold">284 contratti</strong> di importo ≥ €40.000, per un valore
        complessivo di <strong className="font-semibold">~€44,1 mln</strong>
        <Cite
          sourceId="anac"
          what="Contratti ≥ €40k · 284 · €44,1 mln"
          dot="warn"
          tag="ANAC · a rischio"
        />
        .
      </p>
      <p className="m-0 mb-[15px]">
        I principali aggiudicatari per importo cumulato sono operatori del settore costruzioni e
        servizi ambientali: i primi cinque concentrano circa il 38% del valore
        <Cite
          sourceId="anac"
          what="Top 5 operatori · 38% del valore"
          dot="est"
          tag="ANAC · stima"
        />
        . La stazione appaltante più attiva è il Settore Lavori Pubblici
        <Cite
          sourceId="indicepa"
          what="Stazione appaltante più attiva"
          dot="ok"
          tag="IndicePA · CC-BY"
        />
        .
      </p>
      <p className="m-0 mb-[14px] font-hanken text-[12.5px] leading-[1.5] font-normal text-ink-3">
        <Icon name="ph-info" className="text-[13px] align-[-1px]" /> Nel prototipo i nomi degli
        operatori economici sono illustrativi.
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
