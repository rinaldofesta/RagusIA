import { getElezione } from "@/lib/data/repository";
import { Breadcrumb, Icon } from "@/components/primitives/kit";
import { SourceChip } from "@/components/primitives/provenance";

export default async function ElezioniPage() {
  const { data, affluenza, tipo, candidati, liste, consiglieri } = await getElezione();

  return (
    <div className="max-w-[1040px] mx-auto px-9 pt-6 pb-20">
      <Breadcrumb trail={[{ label: "Domini", href: "/domini" }, { label: "Elezioni" }]} />

      <div className="flex items-start gap-[14px]">
        <div className="w-[46px] h-[46px] rounded-xl bg-amber-tint border border-[rgba(194,151,42,0.22)] flex items-center justify-center flex-none">
          <Icon name="ph-check-square" weight="duotone" className="text-[24px] text-amber-d" />
        </div>
        <div className="flex-1">
          <h1 className="font-spectral text-[30px] font-medium text-ink m-0 tracking-[-0.01em]">
            Elezioni comunali
          </h1>
          <p className="font-hanken text-[13.5px] text-ink-2 mt-[3px] mb-0">
            {data} · {tipo}
          </p>
        </div>
        <div className="flex gap-[7px] flex-wrap justify-end">
          <SourceChip sourceId="eligendo" what="Risultati comunali Ragusa 2023" tag="Eligendo · IODL" />
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-4 gap-3 my-6 mb-[26px]">
        <div className="bg-card-2 border border-line rounded-[13px] px-4 py-[15px]">
          <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-3">
            Affluenza
          </div>
          <div className="font-spectral text-[28px] font-semibold text-ink mt-[5px]">
            {affluenza}
          </div>
          <div className="font-hanken text-[11px] text-ink-2 mt-[2px]">
            capoluogo più alto in Sicilia
          </div>
        </div>
        <div className="bg-card-2 border border-line rounded-[13px] px-4 py-[15px]">
          <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-3">
            Sindaco eletto
          </div>
          <div className="font-spectral text-[19px] font-semibold text-ink mt-[5px]">
            Peppe Cassì
          </div>
          <div className="font-hanken text-[11px] text-ink-2 mt-1">al primo turno</div>
        </div>
        <div className="bg-card-2 border border-line rounded-[13px] px-4 py-[15px]">
          <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-3">
            Risultato Cassì
          </div>
          <div className="font-spectral text-[28px] font-semibold text-amber-d mt-[5px]">
            62,92%
          </div>
          <div className="font-hanken text-[11px] text-ink-2 mt-[2px]">21.673 voti</div>
        </div>
        <div className="bg-card-2 border border-line rounded-[13px] px-4 py-[15px]">
          <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.1em] text-ink-3">
            Seggi consiglio
          </div>
          <div className="font-spectral text-[28px] font-semibold text-ink mt-[5px]">24</div>
          <div className="font-hanken text-[11px] text-ink-2 mt-[2px]">+ il sindaco</div>
        </div>
      </div>

      {/* Candidati */}
      <div className="bg-card-2 border border-line rounded-2xl px-5 py-[18px] mb-[14px]">
        <div className="font-hanken text-[13px] font-semibold text-ink mb-[14px]">
          Candidati a sindaco
        </div>
        <div className="flex flex-col gap-[13px]">
          {candidati.map((c, i) => {
            const w = (c.pct / 62.92 * 100).toFixed(1);
            return (
              <div key={i}>
                <div className="flex items-baseline justify-between gap-[10px] mb-[5px]">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-hanken text-[13px] font-semibold text-ink">{c.nome}</span>
                    {c.eletto ? (
                      <span className="font-mono text-[8.5px] font-semibold uppercase tracking-[0.08em] text-white bg-amber rounded-[4px] px-[6px] py-[2px]">
                        eletto
                      </span>
                    ) : null}
                    <span className="font-hanken text-[11px] text-ink-3">{c.coal}</span>
                  </div>
                  <div className="flex items-baseline gap-2 flex-none">
                    <span className="font-spectral text-[13px] font-semibold text-ink">
                      {c.pctLabel}
                    </span>
                    <span className="font-mono text-[10.5px] font-medium text-ink-3">{c.voti}</span>
                  </div>
                </div>
                <div className="h-[9px] bg-sand rounded-[6px] overflow-hidden">
                  <div
                    className="h-full rounded-[6px]"
                    style={{ width: `${w}%`, background: c.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Liste + Consiglieri */}
      <div className="grid grid-cols-2 gap-[14px]">
        <div className="bg-card-2 border border-line rounded-2xl px-5 py-[18px]">
          <div className="font-hanken text-[13px] font-semibold text-ink mb-[14px]">
            Liste collegate · % voti
          </div>
          <div className="flex flex-col gap-[11px]">
            {liste.map((l, i) => {
              const w = (l.pct / liste[0].pct * 100).toFixed(1);
              return (
                <div key={i}>
                  <div className="flex items-baseline justify-between gap-[10px] mb-1">
                    <span className="font-hanken text-[11.5px] font-medium text-ink-2 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis">
                      {l.nome}
                    </span>
                    <span className="font-mono text-[11.5px] font-semibold text-ink flex-none">
                      {l.pctLabel}
                    </span>
                  </div>
                  <div className="h-[7px] bg-sand rounded-[5px] overflow-hidden">
                    <div
                      className="h-full rounded-[5px]"
                      style={{ width: `${w}%`, background: l.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-card-2 border border-line rounded-2xl px-5 py-[18px]">
          <div className="font-hanken text-[13px] font-semibold text-ink mb-[14px]">
            Consiglieri eletti per lista
          </div>
          <div className="flex flex-col gap-3">
            {consiglieri.map((cl, i) => (
              <div key={i} className="flex gap-[10px]">
                <span
                  className="w-[7px] h-[7px] rounded-full flex-none mt-[5px]"
                  style={{ background: cl.color }}
                />
                <div className="min-w-0">
                  <div className="font-hanken text-[11.5px] font-semibold text-ink">{cl.lista}</div>
                  <div className="font-hanken text-[11px] leading-[1.5] text-ink-2 mt-px">
                    {cl.eletti}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="font-hanken text-[11px] text-ink-3 mt-[14px]">
        <Icon name="ph-info" className="text-[12px] align-[-1px]" /> Gli assessori che erano anche
        candidati cedono il seggio ai primi dei non eletti della stessa lista.
      </p>
    </div>
  );
}
