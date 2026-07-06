"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { Source } from "@/lib/model/types";
import { useProvenance } from "./provenance";
import { Icon } from "./kit";

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 px-[13px] py-[11px] border-b border-line last:border-b-0">
      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.06em] text-ink-3">{k}</span>
      <span className="font-mono text-[11.5px] font-semibold text-ink">{v}</span>
    </div>
  );
}

export function ProvenanceDrawer() {
  const params = useSearchParams();
  const { close } = useProvenance();
  const fonte = params.get("fonte");
  const val = params.get("val") ?? "";
  // Keep the loaded source tied to the fonte it was fetched for, so switching
  // fonte shows nothing until the new fetch resolves — no synchronous reset.
  const [loaded, setLoaded] = useState<{ fonte: string; src: Source | null } | null>(null);

  useEffect(() => {
    if (!fonte) return;
    let active = true;
    fetch(`/api/source/${fonte}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => active && setLoaded({ fonte, src: s }))
      .catch(() => active && setLoaded({ fonte, src: null }));
    return () => {
      active = false;
    };
  }, [fonte]);

  const src = loaded && loaded.fonte === fonte ? loaded.src : null;
  if (!fonte || !src) return null;
  const ok = src.status === "ok";

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        aria-label="Chiudi"
        onClick={close}
        className="absolute inset-0 bg-[rgba(28,26,23,0.22)]"
      />
      <div className="absolute top-0 right-0 bottom-0 w-[396px] bg-card-2 border-l border-line-2 shadow-[-24px_0_60px_rgba(28,26,23,0.16)] flex flex-col">
        <div className="px-5 py-[18px] border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-[9px] font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-d">
            <Icon name="ph-seal-check" className="text-[16px]" /> Provenienza
          </div>
          <button
            onClick={close}
            className="w-7 h-7 rounded-[8px] border border-line bg-transparent flex items-center justify-center text-ink-2 hover:bg-sand transition-colors"
          >
            <Icon name="ph-x" className="text-[15px]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {val ? (
            <div className="bg-sand rounded-[11px] px-[14px] py-3 mb-[18px]">
              <div className="font-mono text-[9px] font-semibold uppercase tracking-[0.13em] text-ink-3 mb-[5px]">
                Dato attestato
              </div>
              <div className="font-spectral text-[15px] leading-[1.4] font-medium text-ink">{val}</div>
            </div>
          ) : null}

          <div className="flex items-start gap-3 mb-[18px]">
            <div className="w-10 h-10 rounded-[10px] bg-amber-tint border border-[rgba(194,151,42,0.22)] flex items-center justify-center flex-none">
              <Icon name={src.icon} weight="duotone" className="text-[21px] text-amber-d" />
            </div>
            <div className="min-w-0">
              <div className="font-spectral text-[16px] font-semibold text-ink leading-[1.25]">{src.full}</div>
              {ok ? (
                <div className="inline-flex items-center gap-[6px] mt-[6px] font-mono text-[10.5px] font-semibold text-teal bg-[rgba(42,102,168,0.08)] rounded-[6px] px-2 py-[3px]">
                  <Icon name="ph-check-circle" weight="fill" className="text-[13px]" /> verificata
                </div>
              ) : (
                <div className="inline-flex items-center gap-[6px] mt-[6px] font-mono text-[10.5px] font-semibold text-amber-d bg-[rgba(194,151,42,0.1)] rounded-[6px] px-2 py-[3px]">
                  <Icon name="ph-warning-circle" weight="fill" className="text-[13px]" /> ingestione a rischio
                </div>
              )}
            </div>
          </div>

          <div className="font-hanken text-[13px] leading-[1.6] font-normal text-ink-2 mb-[18px]">{src.what}</div>

          <div className="flex flex-col border border-line rounded-[11px] overflow-hidden">
            <Row k="Licenza" v={src.license} />
            <Row k="Formato" v={src.format} />
            <Row k="Recuperato il" v={src.retrieved} />
            <Row k="Osservato il" v={src.observed} />
            <Row k="Righe" v={src.rows} />
          </div>

          {src.hash ? (
            <div className="mt-3 bg-sand rounded-[10px] px-[13px] py-[11px]">
              <div className="font-mono text-[9px] font-medium uppercase tracking-[0.1em] text-ink-3 mb-1">
                Hash documento (SHA-256)
              </div>
              <div className="font-mono text-[11px] font-medium text-ink-2 break-all">{src.hash}</div>
            </div>
          ) : null}

          <a
            href={src.url}
            target="_blank"
            rel="noopener"
            className="flex items-center gap-[9px] mt-[14px] bg-ink text-paper rounded-[10px] px-[14px] py-[11px] font-hanken text-[12.5px] font-semibold no-underline hover:bg-[#2A2620] transition-colors"
          >
            <Icon name="ph-link-simple" className="text-[15px]" /> Apri la fonte originale
            <Icon name="ph-arrow-up-right" className="ml-auto text-[14px]" />
          </a>

          <div className="mt-[14px] pt-[14px] border-t border-line font-mono text-[11px] leading-[1.5] font-normal text-ink-3">
            ultimo refresh ingestione
            <br />
            <span className="text-ink-2">{src.refresh}</span>
          </div>
        </div>

        <div className="px-5 py-[13px] border-t border-line">
          <Link
            href="/fonti"
            onClick={close}
            className="flex items-center gap-2 w-full justify-center bg-card border border-line-2 rounded-[9px] py-[9px] font-hanken text-[12px] font-semibold text-ink hover:bg-sand transition-colors"
          >
            <Icon name="ph-stack" className="text-[15px] text-amber-d" /> Vedi nel registro Fonti
          </Link>
        </div>
      </div>
    </div>
  );
}
