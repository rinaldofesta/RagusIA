import { Icon } from "@/components/primitives/kit";
import { ProvButton } from "@/components/features/ProvButton";
import type { Source } from "@/lib/model/types";

/** Shared "ingestione a rischio" banner. Renders only when the source's LAST
 *  refresh failed (status === "warn") — one mechanism for every domain page, so
 *  a dashboard can never silently show healthy chrome over stale data. */
export function AtRiskBanner({ source }: { source: Source | null | undefined }) {
  if (source?.status !== "warn") return null;
  return (
    <div className="flex items-center gap-[11px] bg-[rgba(194,151,42,0.07)] border border-[rgba(194,151,42,0.22)] rounded-[11px] px-[14px] py-[11px] mb-[18px]">
      <Icon name="ph-warning-circle" weight="fill" className="text-[18px] text-amber-d flex-none" />
      <div className="flex-1 font-hanken text-[12px] leading-[1.4] font-medium text-ink">
        Ingestione a rischio · l&rsquo;ultimo aggiornamento della fonte {source.short} non è andato a
        buon fine. I valori mostrati sono dell&rsquo;ultimo snapshot valido
        {source.refresh ? ` · ${source.refresh}` : ""}.
      </div>
      <ProvButton
        sourceId={source.id}
        what={`Stato ingestione ${source.short}`}
        className="font-hanken text-[11px] font-semibold text-amber-d bg-transparent border border-[rgba(194,151,42,0.4)] rounded-lg px-[11px] py-[6px] cursor-pointer flex-none hover:bg-[rgba(194,151,42,0.12)] transition-colors"
      >
        Vedi fonte
      </ProvButton>
    </div>
  );
}
