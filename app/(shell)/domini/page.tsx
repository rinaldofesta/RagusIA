import Link from "next/link";
import { getDominiCards } from "@/lib/data/repository";
import { Icon } from "@/components/primitives/kit";
import { SourceChip } from "@/components/primitives/provenance";

export default async function DominiPage() {
  const cards = await getDominiCards();

  return (
    <div className="max-w-[1180px] mx-auto px-9 pt-[30px] pb-[70px]">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-d mb-[10px]">
        Domini · 8 dashboard
      </div>
      <h1 className="font-spectral text-[31px] leading-[1.1] font-medium text-ink m-0 mb-2 tracking-[-0.01em]">
        Dashboard tematiche
      </h1>
      <p className="font-hanken text-[14px] leading-[1.55] text-ink-2 m-0 mb-[26px] max-w-[620px]">
        Una dashboard per dominio: KPI, grafici e tabelle, ogni numero col suo chip di fonte.{" "}
        <strong className="font-semibold text-ink">Bilancio</strong> e{" "}
        <strong className="font-semibold text-ink">Appalti</strong> sono esemplari completi; gli
        altri domini mostrano l&rsquo;ossatura.
      </p>

      <div className="grid grid-cols-4 gap-[14px]">
        {cards.map((c) => (
          <div
            key={c.slug}
            className="relative bg-card-2 border border-line rounded-[14px] p-4 min-h-[148px] flex flex-col hover:border-line-2 transition-colors"
          >
            <Link
              href={`/domini/${c.slug}`}
              className="absolute inset-0 z-0 rounded-[14px]"
              aria-label={c.name}
            />
            <div className="relative z-[1] pointer-events-none flex flex-col flex-1">
              <div className="flex items-center justify-between mb-[13px]">
                <div className="w-[34px] h-[34px] rounded-[9px] bg-sand flex items-center justify-center">
                  <Icon name={c.icon} weight="duotone" className="text-[19px] text-amber-d" />
                </div>
                {c.full ? (
                  <span className="font-mono text-[8.5px] font-semibold uppercase tracking-[0.1em] text-teal bg-[rgba(42,102,168,0.09)] rounded-[5px] px-[7px] py-[3px]">
                    completa
                  </span>
                ) : null}
              </div>
              <div className="font-hanken text-[13.5px] font-semibold text-ink mb-auto">
                {c.name}
              </div>
              <div className="font-spectral text-[24px] leading-none font-medium text-ink mt-[13px] tracking-[-0.01em]">
                {c.value}
              </div>
              <div className="font-hanken text-[11px] font-medium text-ink-3 mt-1">{c.sub}</div>
            </div>
            <div className="relative z-[2] self-start mt-3">
              <SourceChip
                sourceId={c.sourceId}
                what={c.srcVal}
                tag={c.srcTag}
                dot={c.status === "warn" ? "warn" : "ok"}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
