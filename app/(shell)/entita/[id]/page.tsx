import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getEntity,
  getEntitySources,
  getOperatore,
} from "@/lib/data/repository";
import { Icon, KpiCard, SectionCard, EntityRef } from "@/components/primitives/kit";
import { SourceChip } from "@/components/primitives/provenance";
import { EntityBack } from "@/components/features/EntityBack";

export default async function EntitaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ent = await getEntity(id);
  if (!ent) notFound();

  const sources = await getEntitySources(id);

  return (
    <div className="max-w-[1000px] mx-auto px-9 pt-6 pb-[70px]">
      <EntityBack />

      <div className="flex items-start gap-[15px] mb-[14px]">
        <div className="w-[52px] h-[52px] rounded-[13px] bg-amber-tint border border-[rgba(194,151,42,0.2)] flex items-center justify-center flex-none">
          <Icon name={ent.icon} weight="duotone" className="text-[27px] text-amber-d" />
        </div>
        <div className="flex-1">
          <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-3 mb-[5px]">
            {ent.typeLabel}
          </div>
          <h1 className="font-spectral text-[28px] leading-[1.1] font-medium text-ink m-0 tracking-[-0.01em]">
            {ent.name}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-[9px] flex-wrap pt-3 pb-[22px] border-b border-line mb-6">
        <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.1em] text-ink-3">
          Composta da
        </span>
        {sources.map((s) => (
          <SourceChip
            key={s.id}
            sourceId={s.id}
            what={s.what}
            dot={s.status === "warn" ? "warn" : "ok"}
            tag={s.short}
          />
        ))}
        <span className="font-mono text-[11px] font-medium text-ink-3 ml-1">
          · aggiornata 30/06/2026
        </span>
      </div>

      {id === "settore-llpp" ? <SettoreBody /> : null}
      {ent.typeLabel === "Operatore economico" ? <OperatoreBody id={id} /> : null}
      {id === "opera-lungomare" ? <OperaBody /> : null}
      {id !== "settore-llpp" &&
      ent.typeLabel !== "Operatore economico" &&
      id !== "opera-lungomare" ? (
        <GenericBody />
      ) : null}
    </div>
  );
}

function SettoreBody() {
  return (
    <>
      <div className="grid grid-cols-4 gap-[13px] mb-5">
        <KpiCard label="Contratti gestiti" value="124" />
        <KpiCard label="Valore aggiudicato" value="€18,2M" />
        <KpiCard label="Atti emessi" value="312" />
        <KpiCard label="Capitoli" value="18" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <SectionCard>
          <div className="font-hanken text-[12px] font-semibold text-ink mb-[13px]">
            Responsabile
          </div>
          <div className="flex items-center gap-[11px]">
            <div className="w-[38px] h-[38px] rounded-[10px] bg-sand flex items-center justify-center">
              <Icon name="ph-user" weight="duotone" className="text-[20px] text-ink-2" />
            </div>
            <div>
              <div className="font-hanken text-[13px] font-semibold text-ink">
                Dirigente Settore VI
              </div>
              <div className="font-mono text-[10.5px] font-medium text-ink-3">
                responsabile · IPA c_h163
              </div>
            </div>
          </div>
        </SectionCard>
        <SectionCard>
          <div className="font-hanken text-[12px] font-semibold text-ink mb-[13px]">
            Contratti collegati
          </div>
          <EntityRef
            id="op-valdinoto"
            className="flex items-center justify-between w-full py-[7px] border-b border-line transition-opacity hover:opacity-70"
          >
            <span className="font-hanken text-[12px] font-medium text-ink">
              Val di Noto Infrastrutture
            </span>
            <span className="font-mono text-[11px] font-semibold text-ink-2">€2,2M</span>
          </EntityRef>
          <EntityRef
            id="op-iblea"
            className="flex items-center justify-between w-full py-[7px] transition-opacity hover:opacity-70"
          >
            <span className="font-hanken text-[12px] font-medium text-ink">
              Iblea Costruzioni S.r.l.
            </span>
            <span className="font-mono text-[11px] font-semibold text-ink-2">€4,9M</span>
          </EntityRef>
        </SectionCard>
      </div>
    </>
  );
}

async function OperatoreBody({ id }: { id: string }) {
  const op = await getOperatore(id);
  return (
    <>
      <div className="grid grid-cols-3 gap-[13px] mb-5">
        <KpiCard label="Valore aggiudicato" value={op.meta?.value ?? "—"} />
        <KpiCard label="Contratti vinti" value={op.meta?.sub ?? "—"} />
        <div className="bg-card-2 border border-line rounded-[13px] px-4 py-[15px] flex flex-col">
          <div className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-3 mb-[9px]">
            Committente principale
          </div>
          <div className="font-spectral text-[16px] leading-[1.2] font-medium text-ink mt-[5px]">
            Settore VI — LL.PP.
          </div>
        </div>
      </div>
      <SectionCard>
        <div className="flex items-center justify-between mb-[13px]">
          <div className="font-hanken text-[12px] font-semibold text-ink">
            Contratti aggiudicati
          </div>
          <SourceChip sourceId="anac" what="Contratti dell'operatore" tag="ANAC" />
        </div>
        <div className="font-hanken text-[11px] leading-[1.5] text-ink-3 mb-[11px]">
          <Icon name="ph-info" className="text-[12px] align-[-1px]" /> Nome operatore
          illustrativo nel prototipo.
        </div>
        {op.contratti.map((c, i) => (
          <div
            key={i}
            className="grid grid-cols-[96px_1fr_96px_78px] gap-[10px] py-[9px] border-t border-line items-center"
          >
            <span className="font-mono text-[11px] font-medium text-amber-d">{c.cig}</span>
            <span className="font-hanken text-[12px] font-medium text-ink">{c.ogg}</span>
            <span className="font-mono text-[12px] font-semibold text-ink text-right">
              {c.imp}
            </span>
            <span className="font-hanken text-[10.5px] font-medium text-ink-3">{c.data}</span>
          </div>
        ))}
      </SectionCard>
    </>
  );
}

function OperaBody() {
  return (
    <>
      <div className="grid grid-cols-4 gap-[13px] mb-5">
        <div className="bg-card-2 border border-line rounded-[13px] px-4 py-[15px]">
          <div className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-3 mb-2">
            Importo
          </div>
          <div className="font-spectral text-[24px] leading-none font-medium text-ink">
            €1,26M
          </div>
        </div>
        <div className="bg-card-2 border border-line rounded-[13px] px-4 py-[15px]">
          <div className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-3 mb-2">
            Stato
          </div>
          <div className="font-spectral text-[18px] leading-[1.1] font-medium text-teal mt-1">
            In corso
          </div>
        </div>
        <div className="bg-card-2 border border-line rounded-[13px] px-4 py-[15px]">
          <div className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-3 mb-2">
            Avanzamento
          </div>
          <div className="font-spectral text-[24px] leading-none font-medium text-ink">45%</div>
        </div>
        <div className="bg-card-2 border border-line rounded-[13px] px-4 py-[15px]">
          <div className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-ink-3 mb-2">
            Finanziamento
          </div>
          <div className="font-spectral text-[15px] leading-[1.2] font-medium text-ink mt-[5px]">
            PNRR M2 + Coesione
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <SectionCard>
          <div className="font-hanken text-[12px] font-semibold text-ink mb-[13px]">
            Catena di provenienza
          </div>
          <EntityRef
            id="pnrr-m5"
            className="flex items-center gap-[9px] w-full py-2 border-b border-line transition-opacity hover:opacity-70"
          >
            <span className="w-[9px] h-[9px] rounded-[3px] bg-plum flex-none" />
            <span className="flex-1 text-left font-hanken text-[12px] font-medium text-ink">
              PNRR · M2 Transizione ecologica
            </span>
            <Icon name="ph-arrow-up-right" className="text-[13px] text-ink-3" />
          </EntityRef>
          <EntityRef
            id="op-valdinoto"
            className="flex items-center gap-[9px] w-full py-2 border-b border-line transition-opacity hover:opacity-70"
          >
            <span className="w-[9px] h-[9px] rounded-[3px] bg-olive flex-none" />
            <span className="flex-1 text-left font-hanken text-[12px] font-medium text-ink">
              Val di Noto Infrastrutture S.r.l.
            </span>
            <Icon name="ph-arrow-up-right" className="text-[13px] text-ink-3" />
          </EntityRef>
          <EntityRef
            id="settore-llpp"
            className="flex items-center gap-[9px] w-full py-2 transition-opacity hover:opacity-70"
          >
            <span className="w-[9px] h-[9px] rounded-[3px] bg-amber flex-none" />
            <span className="flex-1 text-left font-hanken text-[12px] font-medium text-ink">
              Settore VI — Lavori Pubblici
            </span>
            <Icon name="ph-arrow-up-right" className="text-[13px] text-ink-3" />
          </EntityRef>
        </SectionCard>
        <SectionCard className="flex flex-col">
          <div className="font-hanken text-[12px] font-semibold text-ink mb-[13px]">
            Localizzazione
          </div>
          <div className="flex-1 bg-[#EEE4D0] border border-line rounded-[10px] relative overflow-hidden min-h-[120px]">
            <svg viewBox="0 0 300 140" className="absolute inset-0 w-full h-full">
              <path
                d="M0,108 Q80,96 160,106 T300,104 L300,140 L0,140 Z"
                fill="rgba(42,102,168,0.16)"
              />
              <polygon
                points="60,30 200,24 250,70 210,110 90,108 40,70"
                fill="rgba(194,151,42,0.06)"
                stroke="rgba(154,98,20,0.4)"
                strokeWidth="1.2"
              />
            </svg>
            <div className="absolute left-[48%] top-[72%] -translate-x-1/2 -translate-y-1/2 inline-flex items-center gap-[5px] bg-[#FBF6EC] border border-[rgba(28,26,23,0.16)] rounded-full py-[3px] pr-[9px] pl-[7px] shadow-[0_2px_6px_rgba(28,26,23,0.16)]">
              <span className="w-2 h-2 rounded-full bg-terra" />
              <span className="font-hanken text-[10px] font-semibold text-ink">
                Marina di Ragusa
              </span>
            </div>
          </div>
          <Link
            href="/mappa"
            className="mt-[11px] inline-flex items-center gap-[7px] self-start bg-transparent border-none p-0 font-hanken text-[11.5px] font-semibold text-amber-d cursor-pointer hover:underline"
          >
            Apri nella Mappa <Icon name="ph-arrow-right" className="text-[12px]" />
          </Link>
        </SectionCard>
      </div>
    </>
  );
}

function GenericBody() {
  return (
    <SectionCard padded={false} className="p-5">
      <div className="font-hanken text-[12px] font-semibold text-ink mb-2">Scheda di sintesi</div>
      <p className="font-hanken text-[13.5px] leading-[1.6] text-ink-2 m-0 mb-4 max-w-[600px]">
        Questa entità è un nodo dell&apos;object-model di Ragusia. Da qui partono le relazioni
        verso uffici, atti, contratti e fonti. Le schede object-centric complete e navigabili
        sono quelle di <strong className="font-semibold text-ink">Settore VI</strong>, degli{" "}
        <strong className="font-semibold text-ink">operatori economici</strong> e
        dell&apos;<strong className="font-semibold text-ink">opera Lungomare Marina</strong>.
      </p>
      <div className="flex gap-[10px] flex-wrap">
        <EntityRef
          id="settore-llpp"
          className="inline-flex items-center gap-2 bg-card border border-line-2 rounded-[10px] px-[13px] py-[9px] font-hanken text-[12px] font-semibold text-ink cursor-pointer hover:border-amber hover:bg-amber-tint transition-colors"
        >
          <Icon name="ph-hard-hat" className="text-[15px] text-amber-d" /> Settore VI — LL.PP.
        </EntityRef>
        <EntityRef
          id="opera-lungomare"
          className="inline-flex items-center gap-2 bg-card border border-line-2 rounded-[10px] px-[13px] py-[9px] font-hanken text-[12px] font-semibold text-ink cursor-pointer hover:border-amber hover:bg-amber-tint transition-colors"
        >
          <Icon name="ph-hard-hat" className="text-[15px] text-amber-d" /> Opera Lungomare Marina
        </EntityRef>
        <Link
          href="/esplora"
          className="inline-flex items-center gap-2 bg-card border border-line-2 rounded-[10px] px-[13px] py-[9px] font-hanken text-[12px] font-semibold text-ink cursor-pointer hover:border-amber hover:bg-amber-tint transition-colors"
        >
          <Icon name="ph-graph" className="text-[15px] text-amber-d" /> Vedi nel grafo
        </Link>
      </div>
    </SectionCard>
  );
}
