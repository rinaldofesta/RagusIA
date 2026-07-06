import { EntityRef, Icon } from "@/components/primitives/kit";
import { SourceChip, ProvDot } from "@/components/primitives/provenance";
import { srcDot } from "./prov";
import type { Entity, Source } from "@/lib/model/types";

/** Shared "Da dove arriva" evidence block — entità citate + fonti usate
 *  (design lines 252-283). */
export function Evidence({
  entities,
  sources,
}: {
  entities: Entity[];
  sources: Source[];
}) {
  return (
    <div className="mt-[34px] pt-[22px] border-t border-line">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3 mb-[15px] flex items-center gap-2">
        <Icon name="ph-git-fork" className="text-[14px] text-amber-d" /> Da dove arriva
      </div>
      <div className="grid grid-cols-2 gap-[22px]">
        <div>
          <div className="font-hanken text-[11px] font-semibold text-ink-2 mb-[9px]">
            Entità citate
          </div>
          <div className="flex flex-col gap-[7px]">
            {entities.map((ent) => (
              <EntityRef
                key={ent.id}
                id={ent.id}
                className="flex items-center gap-[10px] bg-card-2 border border-line rounded-[10px] px-[11px] py-[9px] cursor-pointer text-left transition-colors hover:border-amber hover:bg-amber-tint"
              >
                <div className="w-[28px] h-[28px] rounded-[7px] bg-sand flex items-center justify-center flex-none">
                  <Icon name={ent.icon} className="text-[15px] text-ink-2" />
                </div>
                <div className="min-w-0">
                  <div className="font-hanken text-[12px] font-semibold text-ink whitespace-nowrap overflow-hidden text-ellipsis">
                    {ent.name}
                  </div>
                  <div className="font-mono text-[9.5px] font-medium text-ink-3 uppercase tracking-[0.04em]">
                    {ent.typeLabel}
                  </div>
                </div>
                <Icon name="ph-arrow-up-right" className="ml-auto text-[13px] text-ink-3" />
              </EntityRef>
            ))}
          </div>
        </div>
        <div>
          <div className="font-hanken text-[11px] font-semibold text-ink-2 mb-[9px]">
            Fonti usate
          </div>
          <div className="flex flex-col gap-[7px]">
            {sources.map((src) => (
              <div
                key={src.id}
                className="flex items-center gap-[10px] bg-card-2 border border-line rounded-[10px] px-[11px] py-[9px]"
              >
                <ProvDot dot={srcDot(src)} size={7} />
                <div className="min-w-0 flex-1">
                  <div className="font-hanken text-[12px] font-semibold text-ink">{src.short}</div>
                  <div className="font-mono text-[9.5px] font-medium text-ink-3 whitespace-nowrap overflow-hidden text-ellipsis">
                    {src.license} · {src.format}
                  </div>
                </div>
                <SourceChip sourceId={src.id} what={src.what} dot={srcDot(src)} tag="apri" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
