import { AnswerProse } from "@/components/primitives/kit";
import { Cite } from "@/components/primitives/provenance";

/** Bespoke answer prose for the "Chi governa Ragusa?" QA (design lines 161-166). */
export function Giunta() {
  return (
    <AnswerProse>
      <p className="m-0 mb-[15px]">
        Il governo del Comune di Ragusa è guidato dal sindaco{" "}
        <strong className="font-semibold">Giuseppe «Peppe» Cassì</strong>
        <Cite
          sourceId="dait"
          what="Sindaco di Ragusa · mandato 2023"
          dot="ok"
          tag="DAIT · IODL"
        />
        , eletto con una lista civica al secondo mandato — consultazioni del 28–29 maggio 2023
        <Cite
          sourceId="eligendo"
          what="Comunali Ragusa 28–29 maggio 2023"
          dot="ok"
          tag="Eligendo · 2023"
        />
        .
      </p>
      <p className="m-0 mb-[15px]">
        La giunta è composta dal vicesindaco e dagli assessori con deleghe a Bilancio, Lavori
        pubblici, Ambiente, Cultura, Servizi sociali e Urbanistica
        <Cite
          sourceId="indicepa"
          what="Articolazione organi · giunta"
          dot="est"
          tag="IndicePA · da verif."
        />
        . L'esecutivo si raccorda con un consiglio comunale di 24 membri
        <Cite
          sourceId="dait"
          what="Consiglio comunale · 24 seggi"
          dot="ok"
          tag="DAIT · IODL"
        />
        .
      </p>
    </AnswerProse>
  );
}
