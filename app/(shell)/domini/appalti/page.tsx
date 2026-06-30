import { getAppalti } from "@/lib/data/repository";
import { Breadcrumb, Icon, KpiCard, BarRow, SectionCard, EntityRef } from "@/components/primitives/kit";
import { ProvButton } from "@/components/features/ProvButton";

export default async function AppaltiPage() {
  const { kpis, operatori, uffici, contratti } = await getAppalti();

  return (
    <div className="max-w-[1180px] mx-auto px-9 pt-6 pb-[70px]">
      <Breadcrumb
        trail={[{ label: "Domini", href: "/domini" }, { label: "Appalti & Contratti" }]}
      />

      <div className="flex items-start gap-[14px] mb-[18px]">
        <div className="w-[46px] h-[46px] rounded-xl bg-amber-tint border border-[rgba(194,151,42,0.2)] flex items-center justify-center flex-none">
          <Icon name="ph-gavel" weight="duotone" className="text-[25px] text-amber-d" />
        </div>
        <div className="flex-1">
          <h1 className="font-spectral text-[28px] leading-[1.05] font-medium text-ink m-0 mb-1 tracking-[-0.01em]">
            Appalti &amp; Contratti
          </h1>
          <p className="font-hanken text-[13px] text-ink-2 m-0">
            Contratti pubblici ≥ €40.000 dal 2019 · Comune di Ragusa
          </p>
        </div>
      </div>

      <div className="flex items-center gap-[11px] bg-[rgba(194,151,42,0.07)] border border-[rgba(194,151,42,0.22)] rounded-[11px] px-[14px] py-[11px] mb-[18px]">
        <Icon
          name="ph-warning-circle"
          weight="fill"
          className="text-[18px] text-amber-d flex-none"
        />
        <div className="flex-1 font-hanken text-[12px] leading-[1.4] font-medium text-ink">
          Ingestione a rischio · la fonte ANAC ha restituito <strong className="font-bold">0 righe</strong>{" "}all&rsquo;ultimo refresh (atteso 284). I valori mostrati sono dell&rsquo;ultimo snapshot valido del 29/06.
        </div>
        <ProvButton
          sourceId="anac"
          what="Stato ingestione ANAC"
          className="font-hanken text-[11px] font-semibold text-amber-d bg-transparent border border-[rgba(194,151,42,0.4)] rounded-lg px-[11px] py-[6px] cursor-pointer flex-none hover:bg-[rgba(194,151,42,0.12)] transition-colors"
        >
          Vedi fonte
        </ProvButton>
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
                    dot: k.est ? "est" : "warn",
                  }
                : undefined
            }
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 items-start">
        <SectionCard>
          <div className="font-hanken text-[13px] font-semibold text-ink mb-[3px]">
            Top operatori economici
          </div>
          <div className="font-hanken text-[11px] font-medium text-ink-3 mb-[15px]">
            primi 5 su 196 · ≈ 38% del valore · clicca per la scheda
          </div>
          {operatori.map((b, i) => (
            <BarRow
              key={i}
              label={b.label}
              value={b.value}
              pct={b.pct}
              color={b.color}
              entityId={b.entityId}
            />
          ))}
          <div className="font-hanken text-[10.5px] leading-[1.4] text-ink-3 mt-[13px]">
            <Icon name="ph-info" className="text-[12px] align-[-1px]" /> Nomi degli operatori
            illustrativi nel prototipo.
          </div>
        </SectionCard>

        <SectionCard>
          <div className="font-hanken text-[13px] font-semibold text-ink mb-[3px]">
            Per ufficio committente
          </div>
          <div className="font-hanken text-[11px] font-medium text-ink-3 mb-[15px]">
            stazione appaltante · valore aggiudicato
          </div>
          {uffici.map((b, i) => (
            <BarRow
              key={i}
              label={b.label}
              value={b.value}
              pct={b.pct}
              color={b.color}
              entityId={b.entityId}
            />
          ))}
        </SectionCard>
      </div>

      <SectionCard className="mt-4">
        <div className="font-hanken text-[13px] font-semibold text-ink mb-[14px]">
          Contratti recenti
        </div>
        <div className="grid grid-cols-[96px_1fr_96px_1fr_78px_56px] gap-[10px] px-2 pb-[9px] border-b border-line font-mono text-[9.5px] font-semibold uppercase tracking-[0.06em] text-ink-3">
          <span>CIG</span>
          <span>Oggetto</span>
          <span className="text-right">Importo</span>
          <span>Operatore</span>
          <span>Ufficio</span>
          <span>Fonte</span>
        </div>
        {contratti.map((c, i) => (
          <div
            key={i}
            className="grid grid-cols-[96px_1fr_96px_1fr_78px_56px] gap-[10px] px-2 py-[10px] border-b border-line items-center hover:bg-[rgba(28,26,23,0.02)] transition-colors"
          >
            <span className="font-mono text-[11px] font-medium text-amber-d">{c.cig}</span>
            <span className="font-hanken text-[12px] font-medium text-ink">{c.ogg}</span>
            <span className="font-mono text-[12px] font-semibold text-ink text-right">{c.imp}</span>
            <EntityRef
              id={c.entityId}
              className="font-hanken text-[11.5px] font-medium text-teal text-left underline decoration-[rgba(42,102,168,0.3)] underline-offset-2 hover:decoration-teal transition-colors"
            >
              {c.op}
            </EntityRef>
            <span className="font-hanken text-[11px] font-medium text-ink-3">{c.uff}</span>
            <ProvButton
              sourceId="anac"
              what={c.ogg}
              className="justify-self-start w-6 h-6 rounded-[7px] border border-line bg-transparent cursor-pointer flex items-center justify-center text-amber-d hover:bg-amber-tint hover:border-amber transition-colors"
            >
              <Icon name="ph-seal-check" className="text-[13px]" />
            </ProvButton>
          </div>
        ))}
      </SectionCard>
    </div>
  );
}
