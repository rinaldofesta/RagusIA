"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/primitives/kit";

type Phase = "thinking" | "answer" | "evidence";

const SHIMMER_STYLE = {
  background:
    "linear-gradient(90deg,var(--sand) 25%,#F3ECDD 50%,var(--sand) 75%)",
  backgroundSize: "560px 100%",
  animation: "ibShimmer 1.2s linear infinite",
} as const;

/** Client wrapper that runs the staged reveal (thinking → answer → evidence).
 *  The body, evidence and sql are passed in already rendered from the server
 *  (design lines 142-298). */
export function AnswerView({
  question,
  thinkingMeta,
  children,
  evidence,
  sql,
}: {
  question: string;
  thinkingMeta: string;
  children: ReactNode;
  evidence?: ReactNode;
  sql?: ReactNode;
}) {
  const router = useRouter();
  // Tie the phase to the question it belongs to: when `question` changes the
  // derived phase resets to "thinking" without a synchronous setState in the
  // effect (which would cascade renders). The timeouts advance the new question.
  const [state, setState] = useState<{ q: string; phase: Phase }>({ q: question, phase: "thinking" });
  const phase: Phase = state.q === question ? state.phase : "thinking";

  useEffect(() => {
    const toAnswer = setTimeout(() => setState({ q: question, phase: "answer" }), 760);
    const toEvidence = setTimeout(() => setState({ q: question, phase: "evidence" }), 760 + 360);
    return () => {
      clearTimeout(toAnswer);
      clearTimeout(toEvidence);
    };
  }, [question]);

  return (
    <div className="max-w-[840px] mx-auto px-10 pt-[30px] pb-[90px]">
      <button
        type="button"
        onClick={() => router.push("/")}
        className="inline-flex items-center gap-[7px] bg-transparent border-none cursor-pointer py-[6px] font-hanken text-[12px] font-medium text-ink-3 mb-[14px] transition-colors hover:text-amber-d"
      >
        <Icon name="ph-arrow-left" className="text-[14px]" /> Nuova domanda
      </button>

      <div className="flex gap-[13px] items-start mb-[26px]">
        <div className="w-[30px] h-[30px] rounded-[8px] bg-amber-tint border border-[rgba(194,151,42,0.25)] flex items-center justify-center flex-none mt-[2px]">
          <Icon name="ph-quotes" className="text-[15px] text-amber-d" />
        </div>
        <div>
          <div className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.13em] text-ink-3 mb-1">
            La tua domanda
          </div>
          <div className="font-spectral text-[23px] leading-[1.3] font-medium text-ink">
            {question}
          </div>
        </div>
      </div>

      {phase === "thinking" ? (
        <>
          <div className="flex items-center gap-[9px] mb-5 font-hanken text-[12.5px] font-medium text-ink-2">
            <Icon
              name="ph-circle-notch"
              className="text-[15px] text-amber"
              style={{ animation: "ibBlink 1s linear infinite" }}
            />{" "}
            Consulto {thinkingMeta}…
          </div>
          <div
            className="h-[13px] rounded-[5px] mb-[11px] w-[96%]"
            style={SHIMMER_STYLE}
          />
          <div
            className="h-[13px] rounded-[5px] mb-[11px] w-[99%]"
            style={SHIMMER_STYLE}
          />
          <div className="h-[13px] rounded-[5px] w-[72%]" style={SHIMMER_STYLE} />
        </>
      ) : (
        <>
          {children}
          {phase === "evidence" ? (
            <>
              {evidence}
              {sql}
            </>
          ) : null}
        </>
      )}
    </div>
  );
}
