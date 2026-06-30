import { AnswerProse } from "@/components/primitives/kit";

/** Honest "no precomputed answer" body for unrouted questions (design lines 199-203). */
export function Nomatch() {
  return (
    <AnswerProse>
      <p className="m-0 mb-2">
        Non ho una risposta precostruita per questa domanda nel prototipo. Onestà sullo stato del
        dato: piuttosto che improvvisare, ti indico le superfici e le fonti pertinenti da cui
        partire.
      </p>
    </AnswerProse>
  );
}
