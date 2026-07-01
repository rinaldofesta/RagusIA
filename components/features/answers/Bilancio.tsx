import Link from "next/link";
import { AnswerProse, Icon } from "@/components/primitives/kit";
import { Cite } from "@/components/primitives/provenance";
import { srcDot, srcTag, kpiValue, kpiSub } from "./prov";
import type { BilancioData, Source } from "@/lib/model/types";

// ARCONET missions that are technical pass-throughs, not operational spending
// (partite di giro, fondi, debito, anticipazioni). Excluded when naming the
// "largest spending priorities" so the prose describes real service spending.
const NON_OPERATIONAL = new Set(["M20", "M50", "M60", "M99"]);

/** Data-driven answer prose for the bilancio QA — every figure comes from the live BDAP model. */
export function Bilancio({ data, src }: { data: BilancioData; src: Source | null }) {
  const totale = kpiValue(data.kpis, "Totale previsione 2024");
  const capitale = kpiValue(data.kpis, "Conto capitale");
  const capitaleSub = kpiSub(data.kpis, "Conto capitale");
  const top = data.missioni.filter((m) => !NON_OPERATIONAL.has(m.code ?? "")).slice(0, 2);

  return (
    <AnswerProse>
      <p className="m-0 mb-[15px]">
        Il bilancio di previsione 2024 del Comune di Ragusa vale circa{" "}
        <strong className="font-semibold">{totale}</strong>
        <Cite
          sourceId="bdap"
          what={`Bilancio di previsione 2024 · ${totale}`}
          dot={srcDot(src)}
          tag={srcTag(src, "oss. 2024")}
        />
        .
      </p>
      {top.length > 0 && (
        <p className="m-0 mb-[15px]">
          La quota maggiore della spesa è assorbita da{" "}
          {top.map((m, i) => (
            <span key={m.code}>
              <strong className="font-semibold">
                {m.label} ({m.code})
              </strong>
              {i === 0 && top.length > 1 ? " e da " : ""}
            </span>
          ))}
          <Cite
            sourceId="bdap"
            what="Spesa per missione 2024"
            dot={srcDot(src)}
            tag={srcTag(src, "oss. 2024")}
          />
          . La spesa in conto capitale vale{" "}
          <strong className="font-semibold">{capitale}</strong>
          {capitaleSub ? ` (${capitaleSub})` : ""}
          <Cite
            sourceId="bdap"
            what={`Conto capitale · ${capitale}`}
            dot={srcDot(src)}
            tag={srcTag(src, "oss. 2024")}
          />
          .
        </p>
      )}
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
