import { getFontiRegistry, getSourceHealth } from "@/lib/data/repository";
import { SourceRow } from "@/components/features/SourceRow";

export default async function FontiPage() {
  const [list, health] = await Promise.all([getFontiRegistry(), getSourceHealth()]);

  return (
    <div className="max-w-[1120px] mx-auto px-9 pt-[30px] pb-[70px]">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-d mb-[10px]">
        Fonti · registro provenienza
      </div>
      <h1 className="font-spectral text-[31px] leading-[1.1] font-medium text-ink m-0 mb-2 tracking-[-0.01em]">
        La spina dorsale della provenienza
      </h1>
      <p className="font-hanken text-[14px] leading-[1.55] text-ink-2 m-0 mb-6 max-w-[620px]">
        Ogni dato in Ragusia nasce qui. Dodici fonti pubbliche, ciascuna con licenza, formato e
        salute dell&apos;ingestione. Clicca una riga per i dettagli completi.
      </p>

      <div className="grid grid-cols-3 gap-[14px] mb-6">
        <div className="bg-card-2 border border-line rounded-[13px] px-[18px] py-4">
          <div className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.1em] text-ink-3 mb-2">
            Fonti pubbliche
          </div>
          <div className="font-spectral text-[30px] leading-none font-medium text-ink">
            {health.total}
          </div>
        </div>
        <div className="bg-card-2 border border-line rounded-[13px] px-[18px] py-4">
          <div className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.1em] text-ink-3 mb-2">
            Verificate
          </div>
          <div className="flex items-baseline gap-2">
            <div className="font-spectral text-[30px] leading-none font-medium text-teal">
              {health.ok}
            </div>
            <span className="inline-flex items-center gap-[5px] font-hanken text-[11px] font-medium text-ink-3">
              <span className="w-[7px] h-[7px] rounded-full bg-teal" />
              ingestione ok
            </span>
          </div>
        </div>
        <div className="bg-[rgba(194,151,42,0.06)] border border-[rgba(194,151,42,0.25)] rounded-[13px] px-[18px] py-4">
          <div className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.1em] text-amber-d mb-2">
            A rischio
          </div>
          <div className="flex items-baseline gap-2">
            <div className="font-spectral text-[30px] leading-none font-medium text-amber-d">
              {health.warn}
            </div>
            <span className="font-hanken text-[11px] font-medium text-ink-2">
              ANAC · 0 righe oggi
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-[10px]">
        {list.map((s) => (
          <SourceRow key={s.id} source={s} />
        ))}
      </div>
    </div>
  );
}
