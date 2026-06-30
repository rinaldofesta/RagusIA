import {
  getQA,
  getService,
  getEntity,
  getSource,
  routeQuestion,
} from "@/lib/data/repository";
import type { QaBody } from "@/lib/model/types";
import { AnswerView } from "@/components/features/AnswerView";
import { Giunta } from "@/components/features/answers/Giunta";
import { Bilancio } from "@/components/features/answers/Bilancio";
import { Appalti } from "@/components/features/answers/Appalti";
import { Pnrr } from "@/components/features/answers/Pnrr";
import { Demografia } from "@/components/features/answers/Demografia";
import { Nomatch } from "@/components/features/answers/Nomatch";
import { ServiceCard } from "@/components/features/answers/ServiceCard";
import { Evidence } from "@/components/features/answers/Evidence";
import { SqlReveal } from "@/components/features/answers/SqlReveal";

const QA_BODIES: Record<QaBody, () => React.ReactNode> = {
  giunta: Giunta,
  bilancio: Bilancio,
  appalti: Appalti,
  pnrr: Pnrr,
  demografia: Demografia,
  nomatch: Nomatch,
};

export default async function ChiediAnswerPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; qa?: string }>;
}) {
  const { q, qa: qaParam } = await searchParams;

  // Resolve the target id: explicit `qa` wins, else route the free-text question.
  let id: string;
  if (qaParam) {
    id = qaParam;
  } else {
    const routed = await routeQuestion(q ?? "");
    id = routed.id;
  }

  // ---- Service answer (no evidence / sql) ----
  if (id.startsWith("svc-")) {
    const svc = await getService(id);
    if (svc) {
      return (
        <AnswerView question={svc.question} thinkingMeta="le fonti">
          <ServiceCard service={svc} />
        </AnswerView>
      );
    }
    id = "nomatch";
  }

  // ---- QA / nomatch answer (prose + shared evidence + sql) ----
  const qa = await getQA(id);
  if (!qa) {
    // Defensive fallback: behave like nomatch if the id is unknown.
    const nomatch = await getQA("nomatch");
    if (!nomatch) {
      return (
        <AnswerView question={q ?? ""} thinkingMeta="le fonti">
          <Nomatch />
        </AnswerView>
      );
    }
    return renderQA(nomatch, q);
  }

  return renderQA(qa, q);
}

async function renderQA(
  qa: NonNullable<Awaited<ReturnType<typeof getQA>>>,
  q?: string,
) {
  const [entities, sources] = await Promise.all([
    Promise.all(qa.entityIds.map(getEntity)),
    Promise.all(qa.sourceIds.map(getSource)),
  ]);
  const ents = entities.filter((e): e is NonNullable<typeof e> => !!e);
  const srcs = sources.filter((s): s is NonNullable<typeof s> => !!s);

  const Body = QA_BODIES[qa.body];
  const thinkingMeta =
    qa.body === "nomatch"
      ? "le fonti"
      : `${qa.sourceIds.length} fonti · ${qa.entityIds.length} entità`;

  return (
    <AnswerView
      question={qa.question || q || ""}
      thinkingMeta={thinkingMeta}
      evidence={<Evidence entities={ents} sources={srcs} />}
      sql={<SqlReveal sql={qa.sql} />}
    >
      <Body />
    </AnswerView>
  );
}
