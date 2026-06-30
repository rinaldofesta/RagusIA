import Link from "next/link";
import { AnswerProse, Icon } from "@/components/primitives/kit";
import { Cite } from "@/components/primitives/provenance";

/** Bespoke answer prose for the bilancio QA (design lines 168-174). */
export function Bilancio() {
  return (
    <AnswerProse>
      <p className="m-0 mb-[15px]">
        Il bilancio di previsione 2024 del Comune di Ragusa vale circa{" "}
        <strong className="font-semibold">€117,6 mln</strong>
        <Cite
          sourceId="bdap"
          what="Bilancio di previsione 2024 · €117,6 mln"
          dot="ok"
          tag="BDAP · oss. 2024"
        />
        .
      </p>
      <p className="m-0 mb-[15px]">
        La quota maggiore è assorbita dai{" "}
        <strong className="font-semibold">Servizi istituzionali e generali (M01)</strong> e dai{" "}
        <strong className="font-semibold">Diritti sociali (M12)</strong>, seguiti da Assetto del
        territorio (M08) e Sviluppo sostenibile e ambiente (M09)
        <Cite
          sourceId="bdap"
          what="Spesa per missione 2024"
          dot="ok"
          tag="BDAP · oss. 2024"
        />
        . La spesa in conto capitale pesa per circa un quinto del totale
        <Cite
          sourceId="bdap"
          what="Spesa in conto capitale · stima ~20%"
          dot="est"
          tag="BDAP · stima"
        />
        .
      </p>
      <Link
        href="/domini/bilancio"
        className="inline-flex items-center gap-2 mt-1 bg-card border border-line-2 rounded-[10px] px-[14px] py-[9px] font-hanken text-[12.5px] font-semibold text-ink cursor-pointer transition-colors hover:border-amber hover:bg-amber-tint"
      >
        <Icon name="ph-chart-bar" className="text-[15px] text-amber-d" /> Apri la dashboard Bilancio{" "}
        <Icon name="ph-arrow-right" className="text-[13px]" />
      </Link>
    </AnswerProse>
  );
}
