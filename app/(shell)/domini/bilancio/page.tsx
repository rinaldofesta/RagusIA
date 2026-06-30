import { getBilancio } from "@/lib/data/repository";
import { Breadcrumb, Icon, KpiCard, BarRow, SectionCard } from "@/components/primitives/kit";
import { SourceChip } from "@/components/primitives/provenance";

const TW = 460;
const TH = 86;
const TMIN = 98;
const TMAX = 120;

export default async function BilancioPage() {
  const { kpis, missioni, trend, capitoli } = await getBilancio();

  const tx = (i: number) => 16 + (i * (TW - 32)) / (trend.length - 1);
  const ty = (v: number) => TH - 10 - ((v - TMIN) / (TMAX - TMIN)) * (TH - 26);
  const points = trend.map((d, i) => `${tx(i)},${ty(d.v)}`).join(" ");
  const area =
    `M${tx(0)},${TH - 2} ` +
    trend.map((d, i) => `L${tx(i)},${ty(d.v)}`).join(" ") +
    ` L${tx(trend.length - 1)},${TH - 2} Z`;

  return (
    <div className="max-w-[1180px] mx-auto px-9 pt-6 pb-[70px]">
      <Breadcrumb trail={[{ label: "Domini", href: "/domini" }, { label: "Bilancio" }]} />

      <div className="flex items-start gap-[14px] mb-6">
        <div className="w-[46px] h-[46px] rounded-xl bg-amber-tint border border-[rgba(194,151,42,0.2)] flex items-center justify-center flex-none">
          <Icon name="ph-scales" weight="duotone" className="text-[25px] text-amber-d" />
        </div>
        <div className="flex-1">
          <h1 className="font-spectral text-[28px] leading-[1.05] font-medium text-ink m-0 mb-1 tracking-[-0.01em]">
            Bilancio di previsione 2024
          </h1>
          <p className="font-hanken text-[13px] text-ink-2 m-0">
            Entrate e spese per missione, programma e capitolo · Comune di Ragusa
          </p>
        </div>
        <div className="flex-none">
          <SourceChip sourceId="bdap" what="Bilancio di previsione 2024" tag="BDAP · MEF/RGS" dot="ok" />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-[13px] mb-4">
        {kpis.map((k, i) => (
          <KpiCard
            key={i}
            label={k.label}
            value={k.value}
            sub={k.sub}
            chip={
              k.sourceId
                ? {
                    sourceId: k.sourceId,
                    what: k.srcVal,
                    tag: k.srcTag ?? "",
                    dot: k.est ? "est" : k.status === "warn" ? "warn" : "ok",
                  }
                : undefined
            }
          />
        ))}
      </div>

      <div className="grid grid-cols-[1.5fr_1fr] gap-4 items-start">
        <SectionCard>
          <div className="flex items-center justify-between mb-4">
            <div className="font-hanken text-[13px] font-semibold text-ink">
              Spesa per missione · 2024
            </div>
            <SourceChip sourceId="bdap" what="Spesa per missione 2024" tag="BDAP" dot="ok" />
          </div>
          {missioni.map((b, i) => (
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
        </SectionCard>

        <div className="flex flex-col gap-4">
          <SectionCard>
            <div className="font-hanken text-[13px] font-semibold text-ink mb-1">
              Andamento della spesa
            </div>
            <div className="font-hanken text-[11px] font-medium text-ink-3 mb-[14px]">
              previsione 2020 → 2024 · €/mln
            </div>
            <svg viewBox="0 0 460 86" className="w-full h-auto block overflow-visible">
              <path d={area} fill="rgba(194,151,42,0.10)" />
              <polyline
                points={points}
                fill="none"
                stroke="var(--amber)"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex justify-between mt-2">
              {trend.map((d, i) => (
                <div key={i} className="text-center">
                  <div className="font-mono text-[10px] font-semibold text-ink">{d.v}</div>
                  <div className="font-mono text-[9.5px] font-medium text-ink-3 mt-[2px]">{d.y}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard>
            <div className="font-hanken text-[13px] font-semibold text-ink mb-[14px]">
              Composizione della spesa
            </div>
            <div className="h-[13px] rounded-[7px] overflow-hidden flex mb-3">
              <div className="w-[79%] bg-teal" />
              <div className="w-[21%] bg-amber" />
            </div>
            <div className="flex justify-between font-hanken text-[11.5px] font-medium">
              <span className="inline-flex items-center gap-[6px] text-ink-2">
                <span className="w-2 h-2 rounded-[2px] bg-teal" />
                Corrente · €93,1M
              </span>
              <span className="inline-flex items-center gap-[6px] text-ink-2">
                <span className="w-2 h-2 rounded-[2px] bg-amber" />
                Capitale · €24,5M
              </span>
            </div>
          </SectionCard>
        </div>
      </div>

      <SectionCard className="mt-4">
        <div className="flex items-center justify-between mb-[14px]">
          <div className="font-hanken text-[13px] font-semibold text-ink">
            Principali capitoli di spesa
          </div>
          <SourceChip sourceId="bdap" what="Capitoli di spesa 2024" tag="BDAP" dot="ok" />
        </div>
        <div className="grid grid-cols-[88px_1fr_56px_84px_1.1fr] gap-[10px] px-2 pb-[9px] border-b border-line font-mono text-[9.5px] font-semibold uppercase tracking-[0.06em] text-ink-3">
          <span>Capitolo</span>
          <span>Descrizione</span>
          <span>Miss.</span>
          <span className="text-right">Importo</span>
          <span>Ufficio</span>
        </div>
        {capitoli.map((r, i) => (
          <div
            key={i}
            className="grid grid-cols-[88px_1fr_56px_84px_1.1fr] gap-[10px] px-2 py-[10px] border-b border-line items-center hover:bg-[rgba(28,26,23,0.02)] transition-colors"
          >
            <span className="font-mono text-[11px] font-medium text-amber-d">{r.code}</span>
            <span className="font-hanken text-[12.5px] font-medium text-ink">{r.desc}</span>
            <span className="font-mono text-[9.5px] font-semibold text-ink-2">{r.miss}</span>
            <span className="font-mono text-[12px] font-semibold text-ink text-right">{r.imp}</span>
            <span className="font-hanken text-[11px] font-medium text-ink-3">{r.uff}</span>
          </div>
        ))}
      </SectionCard>
    </div>
  );
}
