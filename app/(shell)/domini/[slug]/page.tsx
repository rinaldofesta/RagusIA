import { notFound } from "next/navigation";
import { getDomainDetail } from "@/lib/data/repository";
import { Breadcrumb, Icon, KpiCard, EntityRef, BarRow } from "@/components/primitives/kit";
import { SourceChip } from "@/components/primitives/provenance";

const ALLOWED_SLUGS = ["opere", "pnrr", "demografia", "ambiente"] as const;

export default async function DomainDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!ALLOWED_SLUGS.includes(slug as (typeof ALLOWED_SLUGS)[number])) notFound();

  const detail = await getDomainDetail(slug);
  if (!detail) notFound();

  return (
    <div className="max-w-[1040px] mx-auto px-9 pt-6 pb-[70px]">
      <Breadcrumb trail={[{ label: "Domini", href: "/domini" }, { label: detail.title }]} />

      <div className="flex items-start gap-[14px] mb-6">
        <div className="w-[46px] h-[46px] rounded-xl bg-amber-tint border border-[rgba(194,151,42,0.2)] flex items-center justify-center flex-none">
          <Icon name={detail.icon} weight="duotone" className="text-[25px] text-amber-d" />
        </div>
        <div className="flex-1">
          <h1 className="font-spectral text-[28px] leading-[1.05] font-medium text-ink m-0 mb-1 tracking-[-0.01em]">
            {detail.title}
          </h1>
          <p className="font-hanken text-[13px] leading-[1.45] text-ink-2 m-0 max-w-[560px]">
            {detail.sub}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-[13px] mb-4">
        {detail.kpis.map((k, i) => (
          <KpiCard key={i} label={k.label} value={k.value} sub={k.sub} />
        ))}
      </div>

      {detail.chart ? (
        <div className="bg-card-2 border border-line rounded-[14px] p-[19px_20px] mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="font-hanken text-[13px] font-semibold text-ink">
              {detail.chart.title}
            </div>
            <SourceChip
              sourceId={detail.chart.sourceId}
              what={detail.chart.srcVal}
              tag={detail.chart.srcTag}
            />
          </div>
          {detail.chart.bars.map((b, i) => (
            <BarRow
              key={i}
              label={b.label}
              value={b.value}
              pct={b.pct}
              color={b.color}
              code={b.code}
              entityId={b.entityId}
            />
          ))}
        </div>
      ) : null}

      <div className="flex items-center gap-[14px] flex-wrap">
        <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-3">
          Fonti
        </div>
        {detail.sources.map((id) => (
          <SourceChip key={id} sourceId={id} tag={id} />
        ))}
      </div>

      {detail.cta ? (
        <EntityRef
          id={detail.cta.entityId}
          className="inline-flex items-center gap-2 mt-5 bg-card border border-line-2 rounded-[10px] px-[15px] py-[10px] font-hanken text-[12.5px] font-semibold text-ink cursor-pointer hover:border-amber hover:bg-amber-tint transition-colors"
        >
          <Icon name="ph-cards" className="text-[15px] text-amber-d" /> {detail.cta.label}{" "}
          <Icon name="ph-arrow-right" className="text-[13px]" />
        </EntityRef>
      ) : null}

      <div className="mt-6 px-4 py-[14px] bg-sand rounded-[11px] font-hanken text-[12px] leading-[1.5] text-ink-2">
        <Icon name="ph-sparkle" className="text-[13px] text-amber-d align-[-1px]" /> Vista
        d&apos;ossatura. Gli esemplari completi sono{" "}
        <a
          href="/domini/bilancio"
          className="font-hanken font-semibold text-[12px] text-amber-d cursor-pointer underline underline-offset-2"
        >
          Bilancio
        </a>{" "}
        e{" "}
        <a
          href="/domini/appalti"
          className="font-hanken font-semibold text-[12px] text-amber-d cursor-pointer underline underline-offset-2"
        >
          Appalti
        </a>
        .
      </div>
    </div>
  );
}
