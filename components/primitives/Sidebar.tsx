import Link from "next/link";
import { getNav, getSourceHealth } from "@/lib/data/repository";
import { Icon } from "./kit";
import { NavItem } from "./NavItem";

export async function Sidebar() {
  const [nav, health] = await Promise.all([getNav(), getSourceHealth()]);

  return (
    <aside className="w-[250px] flex-none h-screen box-border border-r border-line flex flex-col bg-[linear-gradient(176deg,#F8F3EA,#F0E9DC)]">
      {/* brand */}
      <div className="px-5 pt-[19px] pb-4 flex items-center gap-3 border-b border-line">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/ragusa-stemma.png"
          alt="Stemma del Comune di Ragusa"
          className="h-16 w-auto flex-none block"
          style={{ filter: "drop-shadow(0 1.5px 2px rgba(33,86,140,0.20))" }}
        />
        <div>
          <div className="font-spectral text-[19px] leading-none font-semibold text-ink tracking-[0.005em]">
            RagusIA
          </div>
          <div className="font-spectral italic text-[9.5px] leading-[1.25] font-normal text-ink-2 tracking-[0.012em] mt-1">
            crevit ragusia hyblae ruinis
          </div>
          <div className="font-mono text-[8px] leading-[1.4] font-semibold uppercase tracking-[0.15em] text-ink-3 mt-[5px]">
            Intelligenza civica
          </div>
        </div>
      </div>

      {/* ente card */}
      <Link
        href="/entita/ente-ragusa"
        className="mx-[14px] mt-[14px] mb-[6px] px-3 py-[10px] flex items-center gap-[10px] bg-card-2 border border-line rounded-[10px] text-left hover:border-line-2 transition-colors"
      >
        <div className="w-[26px] h-[26px] rounded-[6px] bg-sand flex items-center justify-center flex-none">
          <Icon name="ph-bank" className="text-[15px] text-amber-d" />
        </div>
        <div className="min-w-0">
          <div className="font-hanken text-[12.5px] font-semibold text-ink whitespace-nowrap">
            Comune di Ragusa
          </div>
          <div className="font-mono text-[9.5px] font-medium text-ink-3 mt-px">ISTAT 088009 · H163</div>
        </div>
      </Link>

      {/* nav */}
      <nav className="px-[14px] pt-2 pb-1 flex flex-col gap-px">
        {nav.map((item) => (
          <NavItem key={item.id} item={item} />
        ))}
      </nav>

      {/* data status */}
      <div className="mt-auto px-[18px] py-[14px] border-t border-line">
        <Link href="/fonti" className="flex items-center gap-[9px] w-full text-left">
          <span className="relative w-2 h-2 flex-none">
            <span className="absolute inset-0 rounded-full bg-teal" />
            <span
              className="absolute -inset-[3px] rounded-full border border-teal opacity-40"
              style={{ animation: "ibPulse 2.4s ease-in-out infinite" }}
            />
          </span>
          <span className="font-hanken text-[11px] font-medium text-ink-2">
            Stato dati ·{" "}
            <span className="text-ink font-semibold">
              {health.ok}/{health.total} fonti ok
            </span>
          </span>
          <Icon name="ph-caret-right" className="ml-auto text-[12px] text-ink-3" />
        </Link>
        <div className="font-mono text-[9.5px] font-normal text-ink-3 mt-[7px] leading-[1.5]">
          ultimo refresh · {health.lastRefresh}
          <br />
          {health.warn} fonte a rischio · {health.atRisk.join(", ")}
        </div>
      </div>
    </aside>
  );
}
