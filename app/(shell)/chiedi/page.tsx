import {
  getQA,
  getService,
  getEntity,
  getSource,
  routeQuestion,
  getAppalti,
  getBilancio,
  getDomainDetail,
  getOrganigramma,
} from "@/lib/data/repository";
import type { QaBody } from "@/lib/model/types";
import { answerWithSql } from "@/lib/query/engine";
import { isQueryEnabled } from "@/lib/query/provider";
import { AnswerView } from "@/components/features/AnswerView";
import { SqlResults, SqlSources } from "@/components/features/answers/SqlAnswer";
import { Giunta } from "@/components/features/answers/Giunta";
import { Bilancio } from "@/components/features/answers/Bilancio";
import { Appalti } from "@/components/features/answers/Appalti";
import { Pnrr } from "@/components/features/answers/Pnrr";
import { Demografia } from "@/components/features/answers/Demografia";
import { Nomatch } from "@/components/features/answers/Nomatch";
import { ServiceCard } from "@/components/features/answers/ServiceCard";
import { Evidence } from "@/components/features/answers/Evidence";
import { SqlReveal } from "@/components/features/answers/SqlReveal";

/** Render a curated answer body from live repository data (so the prose never drifts
 *  from the dashboards and provenance dots reflect each source's real health). */
async function renderBody(body: QaBody): Promise<React.ReactNode> {
  switch (body) {
    case "giunta": {
      const [org, dait, eligendo] = await Promise.all([
        getOrganigramma(),
        getSource("dait"),
        getSource("eligendo"),
      ]);
      return <Giunta org={org} daitSrc={dait} eligendoSrc={eligendo} />;
    }
    case "bilancio": {
      const [data, src] = await Promise.all([getBilancio(), getSource("bdap")]);
      return <Bilancio data={data} src={src} />;
    }
    case "appalti": {
      const [data, src] = await Promise.all([getAppalti(), getSource("anac")]);
      return <Appalti data={data} src={src} />;
    }
    case "pnrr": {
      const [data, openpnrr, opencoesione] = await Promise.all([
        getDomainDetail("pnrr"),
        getSource("openpnrr"),
        getSource("opencoesione"),
      ]);
      return data ? <Pnrr data={data} pnrrSrc={openpnrr} coesioneSrc={opencoesione} /> : <Nomatch />;
    }
    case "demografia": {
      const [data, src] = await Promise.all([getDomainDetail("demografia"), getSource("istat")]);
      return data ? <Demografia data={data} src={src} /> : <Nomatch />;
    }
    case "nomatch":
      return <Nomatch />;
  }
}

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

  // ---- NL→SQL engine: try a live generated query before falling back to nomatch ----
  if (id === "nomatch" && q && isQueryEnabled()) {
    const result = await answerWithSql(q);
    if (result && result.rows.length > 0) {
      const srcs = (await Promise.all(result.sourceIds.map(getSource))).filter(
        (s): s is NonNullable<typeof s> => !!s,
      );
      return (
        <AnswerView
          question={q}
          thinkingMeta="lo schema civico"
          evidence={<SqlSources sources={srcs} />}
          sql={<SqlReveal sql={result.sql} />}
        >
          <SqlResults result={result} />
        </AnswerView>
      );
    }
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
  const [entities, sources, body] = await Promise.all([
    Promise.all(qa.entityIds.map(getEntity)),
    Promise.all(qa.sourceIds.map(getSource)),
    renderBody(qa.body),
  ]);
  const ents = entities.filter((e): e is NonNullable<typeof e> => !!e);
  const srcs = sources.filter((s): s is NonNullable<typeof s> => !!s);

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
      {body}
    </AnswerView>
  );
}
