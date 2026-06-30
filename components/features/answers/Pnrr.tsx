import { AnswerProse } from "@/components/primitives/kit";
import { Cite } from "@/components/primitives/provenance";

/** Bespoke answer prose for the PNRR QA (design lines 185-190). */
export function Pnrr() {
  return (
    <AnswerProse>
      <p className="m-0 mb-[15px]">
        Sul territorio di Ragusa risultano circa{" "}
        <strong className="font-semibold">463 progetti PNRR</strong>
        <Cite
          sourceId="openpnrr"
          what="Progetti PNRR · Ragusa · ≈ 463"
          dot="ok"
          tag="OpenPNRR · CC-BY"
        />{" "}
        e <strong className="font-semibold">116 interventi</strong> di politica di coesione
        <Cite
          sourceId="opencoesione"
          what="Interventi coesione · ≈ 116"
          dot="ok"
          tag="OpenCoesione · IODL"
        />
        .
      </p>
      <p className="m-0 mb-[15px]">
        I progetti si concentrano sulle missioni{" "}
        <strong className="font-semibold">Istruzione e ricerca (M4)</strong> e{" "}
        <strong className="font-semibold">Inclusione e coesione (M5)</strong>, con quote rilevanti su
        Transizione ecologica (M2) e Digitalizzazione (M1)
        <Cite
          sourceId="openpnrr"
          what="PNRR per missione · Ragusa"
          dot="ok"
          tag="OpenPNRR · CC-BY"
        />
        .
      </p>
    </AnswerProse>
  );
}
