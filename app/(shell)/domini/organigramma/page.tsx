import Link from "next/link";
import { getOrganigramma } from "@/lib/data/repository";
import { Breadcrumb, Icon, EntityRef } from "@/components/primitives/kit";
import { SourceChip } from "@/components/primitives/provenance";

const initials = (nm: string) =>
  nm
    .replace(/[«»]/g, "")
    .trim()
    .split(/\s+/)
    .filter((w) => /[A-Za-zÀ-ú]/.test(w[0]))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

export default async function OrganigrammaPage() {
  const { sindaco, assessori, settori, presidente } = await getOrganigramma();

  return (
    <div className="max-w-[1100px] mx-auto px-9 pt-6 pb-20">
      <Breadcrumb trail={[{ label: "Domini", href: "/domini" }, { label: "Organigramma" }]} />

      <div className="flex items-start gap-[14px]">
        <div className="w-[46px] h-[46px] rounded-xl bg-amber-tint border border-[rgba(194,151,42,0.22)] flex items-center justify-center flex-none">
          <Icon name="ph-tree-structure" weight="duotone" className="text-[24px] text-amber-d" />
        </div>
        <div className="flex-1">
          <h1 className="font-spectral text-[30px] font-medium text-ink m-0 tracking-[-0.01em]">
            Organigramma
          </h1>
          <p className="font-hanken text-[13.5px] text-ink-2 mt-[3px] mb-0">
            Sindaco, giunta e consiglio comunale · mandato 2023–2028
          </p>
        </div>
      </div>

      <div className="flex gap-[7px] flex-wrap my-[15px] mb-7">
        <SourceChip sourceId="dait" what="Amministratori locali · giunta Cassì 2023" tag="DAIT · IODL" />
        <SourceChip sourceId="indicepa" what="Articolazione organi e uffici" tag="IndicePA · CC-BY" />
        <SourceChip sourceId="eligendo" what="Esito elettorale · sindaco eletto" tag="Eligendo · 2023" />
      </div>

      {/* Sindaco */}
      <div className="flex flex-col items-center">
        <EntityRef
          id="sindaco-cassi"
          className="w-full max-w-[580px] bg-[linear-gradient(165deg,var(--card-2),var(--card))] border-[1.5px] border-[rgba(194,151,42,0.32)] rounded-2xl px-[22px] py-5 shadow-[0_8px_28px_rgba(28,26,23,0.07)] flex gap-4 items-center cursor-pointer text-left hover:border-amber transition-colors"
        >
          <div className="w-[58px] h-[58px] rounded-full bg-[linear-gradient(165deg,#C8841F,#A6650F)] text-white flex items-center justify-center font-mono text-[20px] font-semibold flex-none shadow-[inset_0_2px_0_rgba(255,255,255,0.25)]">
            GC
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.13em] text-amber-d mb-[3px]">
              Sindaco
            </div>
            <div className="font-spectral text-[19px] font-semibold text-ink">{sindaco.nome}</div>
            <div className="font-hanken text-[12px] text-ink-2 mt-[2px]">{sindaco.bio}</div>
            <div className="font-hanken text-[11.5px] font-medium text-ink-2 mt-[9px]">
              <span className="text-ink-3">Deleghe ·</span> {sindaco.deleghe}
            </div>
          </div>
          <Icon name="ph-arrow-up-right" className="text-[16px] text-ink-3 self-start" />
        </EntityRef>
        <div className="w-[1.5px] h-[26px] bg-line-2" />
      </div>

      {/* Giunta */}
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3 mb-3">
        Giunta comunale · {assessori.length} assessori
      </div>
      <div className="grid grid-cols-3 gap-3">
        {assessori.map((a, i) => (
          <div key={i} className="bg-card-2 border border-line rounded-[13px] px-[15px] py-[14px]">
            <div className="flex items-center gap-[11px] mb-[10px]">
              <div className="w-[38px] h-[38px] rounded-full bg-sand text-ink flex items-center justify-center font-mono text-[13px] font-semibold flex-none border border-line-2">
                {initials(a.nome)}
              </div>
              <div className="min-w-0">
                <div className="font-hanken text-[13.5px] font-semibold text-ink whitespace-nowrap overflow-hidden text-ellipsis">
                  {a.nome}
                </div>
                {a.vice ? (
                  <div className="inline-block font-mono text-[9px] font-semibold uppercase tracking-[0.08em] text-amber-d bg-amber-tint rounded-[5px] px-[6px] py-[2px] mt-[3px]">
                    Vicesindaco
                  </div>
                ) : (
                  <div className="font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-ink-3 mt-[3px]">
                    {a.ruolo}
                  </div>
                )}
              </div>
            </div>
            <div className="font-hanken text-[11.5px] leading-[1.5] text-ink-2">{a.deleghe}</div>
          </div>
        ))}
      </div>

      {/* Consiglio */}
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3 mt-7 mb-3">
        Consiglio comunale · 24 seggi
      </div>
      <div className="grid grid-cols-[1.1fr_1fr] gap-3">
        <div className="bg-card-2 border border-line rounded-[13px] px-[17px] py-4">
          <div className="flex items-center gap-[11px]">
            <div className="w-[38px] h-[38px] rounded-full bg-teal text-white flex items-center justify-center font-mono text-[13px] font-semibold flex-none">
              FI
            </div>
            <div>
              <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-3">
                Presidente del consiglio
              </div>
              <div className="font-spectral text-[15px] font-semibold text-ink mt-px">
                {presidente}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-[14px]">
            <div className="flex-1 bg-amber-tint rounded-[9px] px-3 py-[10px]">
              <div className="font-spectral text-[19px] font-semibold text-amber-d">~18</div>
              <div className="font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-ink-3 mt-[2px]">
                Maggioranza Cassì
              </div>
            </div>
            <div className="flex-1 bg-sand rounded-[9px] px-3 py-[10px]">
              <div className="font-spectral text-[19px] font-semibold text-ink">~6</div>
              <div className="font-mono text-[10px] font-medium uppercase tracking-[0.06em] text-ink-3 mt-[2px]">
                Opposizione
              </div>
            </div>
          </div>
        </div>
        <Link
          href="/domini/elezioni"
          className="bg-card border border-line-2 rounded-[13px] px-[17px] py-4 cursor-pointer text-left flex flex-col justify-center gap-[6px] hover:border-amber hover:bg-amber-tint transition-colors"
        >
          <Icon name="ph-chart-bar-horizontal" className="text-[22px] text-amber-d" />
          <div className="font-hanken text-[14px] font-semibold text-ink">
            Consiglieri eletti per lista
          </div>
          <div className="font-hanken text-[12px] text-ink-2">
            Apri Elezioni 2023 per il dettaglio dei 24 seggi <Icon name="ph-arrow-right" className="text-[12px]" />
          </div>
        </Link>
      </div>

      {/* Settori */}
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3 mt-7 mb-3">
        Struttura tecnica · 11 settori
      </div>
      <div className="flex flex-wrap gap-2">
        {settori.map((st, i) => (
          <div
            key={i}
            className="inline-flex items-center gap-[7px] bg-card-2 border border-line rounded-[9px] px-3 py-2 font-hanken text-[12px] text-ink-2"
          >
            <Icon name="ph-buildings" className="text-[13px] text-ink-3" />
            Settore {st}
          </div>
        ))}
      </div>
    </div>
  );
}
