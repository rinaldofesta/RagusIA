import { AnswerProse } from "@/components/primitives/kit";
import { Cite } from "@/components/primitives/provenance";
import { srcDot, srcTag, kpiValue, kpiSub } from "./prov";
import type { DomainDetail, Source } from "@/lib/model/types";

/** Data-driven answer prose for the demografia QA — figures come from the live ISTAT model.
 *  The provenance dots reflect ISTAT's real health, so when a refresh is failing the chip
 *  honestly reads "a rischio" over the (still-valid, last-good) definitive figure. */
export function Demografia({ data, src }: { data: DomainDetail; src: Source | null }) {
  const residenti = kpiValue(data.kpis, "Residenti");
  const residentiSub = kpiSub(data.kpis, "Residenti"); // e.g. "al 1/1/2025"
  const stranieri = kpiValue(data.kpis, "Stranieri");
  const superficie = kpiValue(data.kpis, "Superficie");
  const stimaK = data.kpis.find((k) => k.label.startsWith("Stima"));
  const stima = stimaK?.value ?? "—";
  const stimaYear = stimaK?.label.replace(/^Stima\s+/, "") ?? "";

  return (
    <AnswerProse>
      <p className="m-0 mb-[15px]">
        {residentiSub ? `${residentiSub.replace(/^al\s+/, "Al ")} ` : ""}Ragusa conta{" "}
        <strong className="font-semibold">{residenti} residenti</strong>
        <Cite
          sourceId="istat"
          what={`Popolazione residente · ${residenti} (${residentiSub})`}
          dot={srcDot(src)}
          tag={srcTag(src, "CC-BY 4.0")}
        />
        {stimaYear ? (
          <>
            ; la stima pre-censuaria al 1° gennaio {stimaYear} è di circa{" "}
            <strong className="font-semibold">{stima}</strong>
            <Cite
              sourceId="istat"
              what={`Stima pre-censuaria · ${stima} (1/1/${stimaYear})`}
              dot={srcDot(src, true)}
              tag={srcTag(src, "stima")}
            />
          </>
        ) : null}
        .
      </p>
      <p className="m-0 mb-[15px]">
        I cittadini stranieri sono il <strong className="font-semibold">{stranieri}</strong> della
        popolazione
        <Cite
          sourceId="istat"
          what={`Cittadini stranieri · ${stranieri}`}
          dot={srcDot(src)}
          tag={srcTag(src, "CC-BY 4.0")}
        />
        . Il territorio comunale si estende per{" "}
        <strong className="font-semibold">{superficie}</strong>, il più vasto della provincia
        <Cite
          sourceId="istat"
          what={`Superficie · ${superficie}`}
          dot={srcDot(src)}
          tag={srcTag(src, "CC-BY 4.0")}
        />
        .
      </p>
    </AnswerProse>
  );
}
