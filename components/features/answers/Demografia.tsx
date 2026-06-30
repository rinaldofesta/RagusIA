import { AnswerProse } from "@/components/primitives/kit";
import { Cite } from "@/components/primitives/provenance";

/** Bespoke answer prose for the demografia QA (design lines 192-197). */
export function Demografia() {
  return (
    <AnswerProse>
      <p className="m-0 mb-[15px]">
        Al 1° gennaio 2025 Ragusa conta{" "}
        <strong className="font-semibold">73.878 residenti</strong>
        <Cite
          sourceId="istat"
          what="Popolazione residente · 73.878 (1/1/2025)"
          dot="ok"
          tag="ISTAT · CC-BY"
        />
        ; la stima pre-censuaria al 1° gennaio 2026 è di circa{" "}
        <strong className="font-semibold">74.122</strong>
        <Cite
          sourceId="istat"
          what="Stima pre-censuaria · 74.122 (1/1/2026)"
          dot="est"
          tag="ISTAT · stima"
        />
        .
      </p>
      <p className="m-0 mb-[15px]">
        I cittadini stranieri sono il <strong className="font-semibold">9,6%</strong> della
        popolazione
        <Cite
          sourceId="istat"
          what="Cittadini stranieri · 9,6%"
          dot="ok"
          tag="ISTAT · CC-BY"
        />
        . Il territorio comunale si estende per{" "}
        <strong className="font-semibold">444,67 km²</strong>, il più vasto della provincia
        <Cite
          sourceId="istat"
          what="Superficie · 444,67 km²"
          dot="ok"
          tag="ISTAT · CC-BY"
        />
        .
      </p>
    </AnswerProse>
  );
}
