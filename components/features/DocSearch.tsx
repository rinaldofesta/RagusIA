"use client";

import { useState } from "react";
import { Icon } from "@/components/primitives/kit";
import { SourceChip } from "@/components/primitives/provenance";
import { docTokens, docMatches } from "@/lib/search/matcher";
import type { DocItem, DocSection } from "@/lib/model/types";

const suggested = [
  "delibere di giunta sul bilancio 2024",
  "determine Settore VI",
  "ordinanze balneazione",
];

type SourceMeta = { short: string; license: string; url: string };

export function DocSearch({
  docs,
  trasparente,
  albo,
  sourcesById,
}: {
  docs: DocItem[];
  trasparente: DocSection[];
  albo: DocSection[];
  sourcesById: Record<string, SourceMeta>;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSearched(true);
  }

  function handleSuggested(q: string) {
    setQuery(q);
    setSearched(true);
  }

  function toggleFilter(id: string) {
    setFilter((f) => (f === id ? null : id));
  }

  function clear() {
    setQuery("");
    setFilter(null);
    setSearched(false);
  }

  const tokens = docTokens(query);
  const results = docs.filter(
    (d) => (!filter || d.tags.includes(filter)) && docMatches(d, tokens),
  );

  const activeSection =
    [...trasparente, ...albo].find((x) => x.id === filter) ?? null;
  const active = Boolean(filter) || (searched && query.trim().length > 0);
  const filterLabel = activeSection ? activeSection.label : `"${query}"`;

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-[10px] bg-card-2 border-[1.5px] border-line-2 rounded-[13px] py-2 pr-2 pl-[15px] shadow-[0_1px_2px_rgba(28,26,23,0.04),0_6px_18px_rgba(28,26,23,0.04)] max-w-[680px]"
      >
        <Icon name="ph-magnifying-glass" className="text-[18px] text-amber" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Es. trovami le delibere di giunta sul bilancio 2024"
          className="flex-1 border-none outline-none bg-transparent font-hanken text-[15px] text-ink min-w-0 placeholder:text-ink-3"
        />
        <button
          type="submit"
          className="flex items-center gap-[6px] bg-amber text-white border-none rounded-[9px] px-[14px] py-[9px] font-hanken text-[12.5px] font-semibold cursor-pointer hover:bg-amber-d transition-colors"
        >
          Cerca
        </button>
      </form>

      <div className="flex flex-wrap gap-2 mt-3">
        {suggested.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => handleSuggested(q)}
            className="inline-flex items-center gap-[6px] bg-card border border-line rounded-full px-3 py-[6px] font-hanken text-[11.5px] font-medium text-ink-2 cursor-pointer hover:border-amber hover:text-ink hover:bg-amber-tint transition-colors"
          >
            <Icon name="ph-arrow-bend-down-right" className="text-[13px] text-amber-d" />
            {q}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[248px_1fr] gap-[22px] mt-7 items-start">
        <div className="flex flex-col gap-[18px] sticky top-5">
          <div>
            <div className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-ink-3 mb-[9px]">
              Amministrazione Trasparente
            </div>
            {trasparente.map((x) => (
              <button
                key={x.id}
                type="button"
                onClick={() => toggleFilter(x.id)}
                className="flex items-center gap-[9px] w-full px-[9px] py-[6px] rounded-[8px] border border-transparent bg-transparent cursor-pointer text-left hover:bg-[rgba(28,26,23,0.04)]"
              >
                {filter === x.id ? (
                  <span className="w-[3px] h-[14px] bg-amber rounded-[2px] ml-[-6px] mr-[-3px]" />
                ) : null}
                <span className="font-hanken text-[12px] font-medium text-ink flex-1">
                  {x.label}
                </span>
                <span className="font-mono text-[9.5px] font-medium text-ink-3">{x.count}</span>
              </button>
            ))}
          </div>
          <div>
            <div className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-ink-3 mb-[9px]">
              Albo Pretorio
            </div>
            {albo.map((x) => (
              <button
                key={x.id}
                type="button"
                onClick={() => toggleFilter(x.id)}
                className="flex items-center gap-[9px] w-full px-[9px] py-[6px] rounded-[8px] border border-transparent bg-transparent cursor-pointer text-left hover:bg-[rgba(28,26,23,0.04)]"
              >
                {filter === x.id ? (
                  <span className="w-[3px] h-[14px] bg-amber rounded-[2px] ml-[-6px] mr-[-3px]" />
                ) : null}
                <span className="font-hanken text-[12px] font-medium text-ink flex-1">
                  {x.label}
                </span>
                <span className="font-mono text-[9.5px] font-medium text-ink-3">{x.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-[10px] mb-[13px]">
            <div className="font-hanken text-[12px] font-medium text-ink-2">
              <span className="text-ink font-bold">{results.length}</span> documenti
            </div>
            {active ? (
              <div className="inline-flex items-center gap-[7px] font-hanken text-[11px] font-medium text-ink-2 bg-amber-tint border border-[rgba(194,151,42,0.25)] rounded-full py-[3px] pr-[3px] pl-[11px]">
                <span>{filterLabel}</span>
                <button
                  type="button"
                  onClick={clear}
                  className="w-[18px] h-[18px] rounded-full border-none bg-[rgba(28,26,23,0.08)] cursor-pointer flex items-center justify-center text-ink-2 hover:bg-[rgba(28,26,23,0.16)] transition-colors"
                >
                  <Icon name="ph-x" className="text-[10px]" />
                </button>
              </div>
            ) : null}
          </div>
          <div className="flex flex-col gap-[9px]">
            {results.map((d) => {
              const src = sourcesById[d.sourceId];
              return (
                <div
                  key={d.id}
                  className="bg-card-2 border border-line rounded-[12px] px-4 py-[14px] hover:border-line-2 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-[34px] h-[34px] rounded-[9px] bg-sand flex items-center justify-center flex-none mt-px">
                      <Icon
                        name="ph-file-text"
                        weight="duotone"
                        className="text-[18px] text-amber-d"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-[3px] flex-wrap">
                        <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.05em] text-teal bg-[rgba(42,102,168,0.08)] rounded-[5px] px-[7px] py-[2px]">
                          {d.tipo}
                        </span>
                        <span className="font-mono text-[11px] font-medium text-ink-3">{d.n}</span>
                      </div>
                      <div className="font-spectral text-[14.5px] font-medium text-ink mb-[6px]">
                        {d.title}
                      </div>
                      <div className="font-hanken text-[11px] font-medium text-ink-3">
                        {d.uff} · {d.sez} · {d.date}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-[7px] flex-none">
                      {src ? (
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener"
                          className="inline-flex items-center gap-[5px] bg-ink text-[#F4EFE6] rounded-[8px] px-[10px] py-[6px] font-hanken text-[10.5px] font-semibold no-underline hover:bg-[#2A2620] transition-colors"
                        >
                          <Icon name="ph-arrow-up-right" className="text-[12px]" /> Apri atto
                        </a>
                      ) : null}
                      {src ? (
                        <SourceChip sourceId={d.sourceId} what={d.title} tag={src.short} />
                      ) : null}
                    </div>
                  </div>
                  {d.hash ? (
                    <div className="mt-[10px] pt-[9px] border-t border-dashed border-line font-mono text-[10px] font-medium text-ink-3">
                      <Icon name="ph-fingerprint" className="text-[12px] align-[-1px]" /> hash{" "}
                      {d.hash}… · {src?.license}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
