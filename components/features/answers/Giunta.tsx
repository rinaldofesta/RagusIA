import { AnswerProse } from "@/components/primitives/kit";
import { Cite } from "@/components/primitives/provenance";
import { srcDot, srcTag } from "./prov";
import type { Organigramma, Source } from "@/lib/model/types";

/** Data-driven answer prose for the "Chi governa Ragusa?" QA — the sindaco and giunta
 *  composition come from the live DAIT/organigramma model. */
export function Giunta({
  org,
  daitSrc,
  eligendoSrc,
}: {
  org: Organigramma;
  daitSrc: Source | null;
  eligendoSrc: Source | null;
}) {
  const nAssessori = org.assessori.length;

  return (
    <AnswerProse>
      <p className="m-0 mb-[15px]">
        Il governo del Comune di Ragusa è guidato dal sindaco{" "}
        <strong className="font-semibold">{org.sindaco.nome}</strong>
        <Cite
          sourceId="dait"
          what="Sindaco di Ragusa · mandato 2023"
          dot={srcDot(daitSrc)}
          tag={srcTag(daitSrc, "IODL")}
        />
        , eletto con una lista civica al secondo mandato — consultazioni del 28–29 maggio 2023
        <Cite
          sourceId="eligendo"
          what="Comunali Ragusa 28–29 maggio 2023"
          dot={srcDot(eligendoSrc)}
          tag={srcTag(eligendoSrc, "2023")}
        />
        .
      </p>
      <p className="m-0 mb-[15px]">
        La giunta è composta dal vicesindaco e da{" "}
        <strong className="font-semibold">{nAssessori} assessori</strong> con deleghe a Bilancio,
        Lavori pubblici, Ambiente, Cultura, Servizi sociali e Urbanistica
        <Cite
          sourceId="dait"
          what="Articolazione organi · giunta"
          dot={srcDot(daitSrc)}
          tag={srcTag(daitSrc, "IODL")}
        />
        . L'esecutivo si raccorda con il consiglio comunale
        <Cite
          sourceId="dait"
          what="Consiglio comunale"
          dot={srcDot(daitSrc)}
          tag={srcTag(daitSrc, "IODL")}
        />
        .
      </p>
    </AnswerProse>
  );
}
