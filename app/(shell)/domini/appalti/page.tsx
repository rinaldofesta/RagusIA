import { getAppalti, getSources } from "@/lib/data/repository";
import { Breadcrumb, Icon, KpiCard, BarRow, SectionCard } from "@/components/primitives/kit";
import { ProvButton } from "@/components/features/ProvButton";
import { AtRiskBanner } from "@/components/features/AtRiskBanner";
import { srcDot } from "@/components/features/answers/prov";

export default async function AppaltiPage() {
  const [{ kpis, operatori, uffici, contratti }, sources] = await Promise.all([
    getAppalti(),
    getSources(),
  ]);
  const srcById = new Map(sources.map((s) => [s.id, s]));
  const anac = srcById.get("anac") ?? null;

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
            Contratti pubblici del Comune di Ragusa · dati ANAC (BDNCP)
          </p>
        </div>
      </div>

      <AtRiskBanner source={anac} />

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
                    dot: srcDot(srcById.get(k.sourceId), k.est),
                  }
                : undefined
            }
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 items-start">
        <SectionCard>
          <div className="font-hanken text-[13px] font-semibold text-ink mb-[3px]">
            Per tipologia di contratto
          </div>
          <div className="font-hanken text-[11px] font-medium text-ink-3 mb-[15px]">
            lavori · servizi · forniture · valore a base di gara
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
          <span>Tipologia</span>
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
            <span className="font-hanken text-[11.5px] font-medium text-ink-2">{c.op}</span>
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
