import { Icon } from "@/components/primitives/kit";
import { SourceChip } from "@/components/primitives/provenance";
import type { Service } from "@/lib/model/types";

/** Servizio al cittadino scheda — the service-answer card (design lines 205-250). */
export function ServiceCard({ service }: { service: Service }) {
  return (
    <div className="max-w-[768px]">
      <div className="flex gap-[13px] items-start mb-[10px]">
        <div className="w-[44px] h-[44px] rounded-[12px] bg-amber-tint border border-[rgba(194,151,42,0.22)] flex items-center justify-center flex-none">
          <Icon name={service.icona} weight="duotone" className="text-[24px] text-amber-d" />
        </div>
        <div>
          <div className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.13em] text-teal mb-1">
            Servizio al cittadino
          </div>
          <div className="font-spectral text-[23px] leading-[1.2] font-medium text-ink">
            {service.nome}
          </div>
        </div>
      </div>

      <p className="font-spectral text-[16px] leading-[1.6] font-normal text-ink-2 m-0 mb-3">
        {service.sintesi}
      </p>

      <div className="inline-flex items-center gap-[7px] bg-sand rounded-[8px] px-[11px] py-[6px] font-hanken text-[11.5px] font-medium text-ink-2 mb-5">
        <Icon name="ph-buildings" className="text-[14px] text-amber-d" />
        {service.ufficio}
      </div>

      <div className="grid grid-cols-[1.35fr_1fr] gap-4 items-start">
        <div className="flex flex-col gap-[14px]">
          <div className="bg-card-2 border border-line rounded-[14px] px-[18px] py-4">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-3 mb-[14px]">
              Come fare
            </div>
            <div className="flex flex-col gap-[13px]">
              {service.comeFare.map((step, i) => (
                <div key={i} className="flex gap-[11px] items-start">
                  <span className="w-[22px] h-[22px] rounded-full bg-amber text-white font-hanken text-[11px] font-semibold flex items-center justify-center flex-none mt-px">
                    {i + 1}
                  </span>
                  <span className="font-hanken text-[13.5px] leading-[1.5] font-normal text-ink">
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card-2 border border-line rounded-[14px] px-[18px] py-4">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-3 mb-3">
              Cosa serve
            </div>
            <div className="flex flex-col gap-[9px]">
              {service.cosaServe.map((c, i) => (
                <div key={i} className="flex gap-[10px] items-start">
                  <Icon
                    name="ph-check-circle"
                    className="text-[16px] text-teal flex-none mt-px"
                  />
                  <span className="font-hanken text-[13px] leading-[1.45] font-normal text-ink-2">
                    {c}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-sand border border-line rounded-[14px] px-4 pt-1 pb-4">
          <div className="py-3 border-b border-line-2">
            <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-3 mb-1">
              Dove
            </div>
            <div className="font-hanken text-[12.5px] leading-[1.35] font-medium text-ink">
              {service.dove}
            </div>
          </div>
          <div className="py-3 border-b border-line-2">
            <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-3 mb-1">
              Quando
            </div>
            <div className="font-hanken text-[12.5px] leading-[1.35] font-medium text-ink">
              {service.quando}
            </div>
          </div>
          <div className="flex gap-[14px] py-3 border-b border-line-2">
            <div className="flex-1">
              <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-3 mb-1">
                Costo
              </div>
              <div className="font-hanken text-[13px] font-semibold text-ink">{service.costo}</div>
            </div>
            <div className="flex-1">
              <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-3 mb-1">
                Tempi
              </div>
              <div className="font-hanken text-[12.5px] font-medium text-ink">{service.tempi}</div>
            </div>
          </div>
          <a
            href={service.online.url}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-[9px] justify-center mt-[14px] bg-ink text-[#F4EFE6] rounded-[10px] px-[14px] py-[11px] font-hanken text-[12.5px] font-semibold no-underline transition-colors hover:bg-[#2A2620]"
          >
            <Icon name="ph-arrow-square-out" className="text-[16px]" />
            {service.online.label}
          </a>
        </div>
      </div>

      <div className="mt-[18px] pt-4 border-t border-line flex items-center gap-3 flex-wrap">
        <SourceChip
          sourceId={service.sourceId}
          what={service.fonteVal}
          dot="ok"
          tag="Fonte ufficiale"
        />
        <span className="font-hanken text-[12px] leading-[1.45] font-normal text-ink-3 flex-1 min-w-[200px]">
          Servizio reale del Comune di Ragusa, reso fruibile in linguaggio naturale — niente più
          moduli sparsi sul sito.
        </span>
      </div>
    </div>
  );
}
