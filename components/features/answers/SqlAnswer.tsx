import type { Source } from "@/lib/model/types";
import type { SqlAnswerResult } from "@/lib/query/engine";
import { AnswerProse, Icon } from "@/components/primitives/kit";
import { SourceChip } from "@/components/primitives/provenance";
import { srcDot } from "./prov";

function fmtCell(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "number") return Number.isInteger(v) ? v.toLocaleString("it-IT") : v.toLocaleString("it-IT", { maximumFractionDigits: 2 });
  return String(v);
}

/** Results body for an NL→SQL answer: a compact table over the returned rows. */
export function SqlResults({ result }: { result: SqlAnswerResult }) {
  const { columns, rows } = result;
  const shown = rows.slice(0, 50);

  // Scalar result (1×1) → render as a headline, not a table.
  if (rows.length === 1 && columns.length === 1) {
    return (
      <AnswerProse>
        <p className="m-0">
          <strong className="font-semibold">{fmtCell(rows[0][columns[0]])}</strong>
        </p>
      </AnswerProse>
    );
  }

  return (
    <div className="max-w-[760px]">
      <div className="font-hanken text-[13px] text-ink-2 mb-3">
        Risposta generata interrogando l&rsquo;archivio civico ·{" "}
        <span className="text-ink-3">{rows.length} righe</span>
      </div>
      <div className="overflow-x-auto border border-line rounded-[12px] bg-card-2">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-line">
              {columns.map((c) => (
                <th key={c} className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.06em] text-ink-3 px-3 py-[10px] whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((r, i) => (
              <tr key={i} className="border-b border-line last:border-b-0 hover:bg-[rgba(28,26,23,0.02)]">
                {columns.map((c) => (
                  <td key={c} className="font-hanken text-[12.5px] text-ink px-3 py-[9px] align-top">
                    {fmtCell(r[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > shown.length ? (
        <div className="font-hanken text-[11px] text-ink-3 mt-2">
          <Icon name="ph-info" className="text-[12px] align-[-1px]" /> Mostrate le prime {shown.length} di {rows.length} righe.
        </div>
      ) : null}
    </div>
  );
}

/** "Fonti usate" — provenance chips for the sources the query touched. */
export function SqlSources({ sources }: { sources: Source[] }) {
  if (!sources.length) return null;
  return (
    <div className="mt-[34px] pt-[22px] border-t border-line">
      <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-3 mb-[15px] flex items-center gap-2">
        <Icon name="ph-git-fork" className="text-[14px] text-amber-d" /> Da dove arriva
      </div>
      <div className="flex flex-wrap gap-2">
        {sources.map((s) => (
          <SourceChip
            key={s.id}
            sourceId={s.id}
            what={s.what}
            tag={`${s.short} · ${s.license}`}
            dot={srcDot(s)}
          />
        ))}
      </div>
    </div>
  );
}
