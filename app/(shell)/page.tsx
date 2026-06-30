import { getSuggested } from "@/lib/data/repository";
import { SuggestionChip } from "@/components/primitives/kit";
import { AskBox } from "@/components/features/AskBox";

export default async function ChiediHomePage() {
  const suggested = await getSuggested();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-14 px-8">
      <div className="w-full max-w-[720px]">
        <div className="flex items-center gap-[9px] justify-center mb-6 font-mono text-[11px] font-medium text-ink-3 tracking-[0.02em]">
          <span>Lun 30 giugno 2026</span>
          <span className="opacity-40">·</span>
          <span className="inline-flex items-center gap-[5px]">
            <span className="w-[6px] h-[6px] rounded-full bg-teal" />
            Comune di Ragusa
          </span>
        </div>

        <h1 className="font-spectral text-[39px] leading-[1.12] font-medium text-center text-ink m-0 mb-[10px] tracking-[-0.012em]">
          Chiedi qualcosa su Ragusa.
        </h1>
        <p className="text-center text-ink-2 text-[14.5px] leading-[1.5] m-0 mb-7">
          Ogni risposta è tracciata alla fonte originale.
          <br />
          <span className="text-ink-3">Un archivio che pensa — non un assistente che improvvisa.</span>
        </p>

        <AskBox />

        <div className="flex flex-wrap gap-2 justify-center mt-[18px]">
          {suggested.civica.map((s) => (
            <SuggestionChip
              key={s.id}
              href={`/chiedi?qa=${s.id}`}
              icon={s.icon}
              label={s.q}
              accent="amber"
            />
          ))}
        </div>

        <div className="flex items-center gap-[11px] justify-center mt-6">
          <span className="h-px flex-1 max-w-[52px] bg-line" />
          <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-ink-3">
            Servizi al cittadino
          </span>
          <span className="h-px flex-1 max-w-[52px] bg-line" />
        </div>
        <div className="flex flex-wrap gap-2 justify-center mt-[13px]">
          {suggested.servizi.map((s) => (
            <SuggestionChip
              key={s.id}
              href={`/chiedi?qa=${s.id}`}
              icon={s.icon}
              label={s.q}
              accent="teal"
            />
          ))}
        </div>

        <div className="flex items-center justify-center gap-[22px] mt-[46px] pt-[22px] border-t border-line">
          <div className="text-center">
            <div className="font-spectral text-[20px] font-semibold text-ink">≈ 7.400</div>
            <div className="font-mono text-[9.5px] font-medium uppercase tracking-[0.1em] text-ink-3 mt-[3px]">
              entità
            </div>
          </div>
          <div className="w-px h-[30px] bg-line" />
          <div className="text-center">
            <div className="font-spectral text-[20px] font-semibold text-ink">≈ 18.200</div>
            <div className="font-mono text-[9.5px] font-medium uppercase tracking-[0.1em] text-ink-3 mt-[3px]">
              relazioni
            </div>
          </div>
          <div className="w-px h-[30px] bg-line" />
          <div className="text-center">
            <div className="font-spectral text-[20px] font-semibold text-ink">12</div>
            <div className="font-mono text-[9.5px] font-medium uppercase tracking-[0.1em] text-ink-3 mt-[3px]">
              fonti pubbliche
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
