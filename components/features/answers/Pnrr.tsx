import { AnswerProse } from "@/components/primitives/kit";
import { Cite } from "@/components/primitives/provenance";
import { srcDot, srcTag, kpiValue } from "./prov";
import type { DomainDetail, Source } from "@/lib/model/types";

/** Data-driven answer prose for the PNRR QA — figures come from the live OpenPNRR / OpenCoesione model. */
export function Pnrr({
  data,
  pnrrSrc,
  coesioneSrc,
}: {
  data: DomainDetail;
  pnrrSrc: Source | null;
  coesioneSrc: Source | null;
}) {
  const progetti = kpiValue(data.kpis, "Progetti PNRR");
  const coesione = kpiValue(data.kpis, "Coesione");
  // Top missioni by project count, straight from the live per-missione chart.
  const top = (data.chart?.bars ?? []).filter((b) => b.pct > 0).slice(0, 2);

  return (
    <AnswerProse>
      <p className="m-0 mb-[15px]">
        Sul territorio di Ragusa risultano circa{" "}
        <strong className="font-semibold">{progetti} progetti PNRR</strong>
        <Cite
          sourceId="openpnrr"
          what={`Progetti PNRR · Ragusa · ${progetti}`}
          dot={srcDot(pnrrSrc)}
          tag={srcTag(pnrrSrc, "ODbL 1.0")}
        />{" "}
        e <strong className="font-semibold">{coesione} interventi</strong> di politica di coesione
        <Cite
          sourceId="opencoesione"
          what={`Interventi coesione · ${coesione}`}
          dot={srcDot(coesioneSrc)}
          tag={srcTag(coesioneSrc, "CC-BY 4.0")}
        />
        .
      </p>
      {top.length > 0 && (
        <p className="m-0 mb-[15px]">
          I progetti si concentrano sulle missioni{" "}
          {top.map((b, i) => (
            <span key={b.label}>
              <strong className="font-semibold">{b.label}</strong>
              {i === 0 && top.length > 1 ? " e " : ""}
            </span>
          ))}
          <Cite
            sourceId="openpnrr"
            what="PNRR per missione · Ragusa"
            dot={srcDot(pnrrSrc)}
            tag={srcTag(pnrrSrc, "ODbL 1.0")}
          />
          .
        </p>
      )}
    </AnswerProse>
  );
}
