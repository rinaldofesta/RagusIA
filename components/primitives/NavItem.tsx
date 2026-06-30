"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem as NavItemType } from "@/lib/model/types";
import { Icon } from "./kit";

const ROUTES: Record<string, string> = {
  chiedi: "/",
  esplora: "/esplora",
  domini: "/domini",
  mappa: "/mappa",
  documenti: "/documenti",
  fonti: "/fonti",
};

function isActive(id: string, pathname: string): boolean {
  switch (id) {
    case "chiedi":
      return pathname === "/" || pathname.startsWith("/chiedi");
    case "esplora":
      return pathname.startsWith("/esplora") || pathname.startsWith("/entita");
    case "domini":
      return pathname.startsWith("/domini");
    case "mappa":
      return pathname.startsWith("/mappa");
    case "documenti":
      return pathname.startsWith("/documenti");
    case "fonti":
      return pathname.startsWith("/fonti");
    default:
      return false;
  }
}

export function NavItem({ item }: { item: NavItemType }) {
  const pathname = usePathname();
  const active = isActive(item.id, pathname);
  return (
    <Link
      href={ROUTES[item.id] ?? "/"}
      className="relative flex items-center gap-[11px] px-[11px] py-[9px] rounded-[9px] border border-transparent w-full text-left hover:bg-[rgba(28,26,23,0.045)] transition-colors"
    >
      {active ? (
        <>
          <span className="absolute inset-0 bg-[rgba(42,102,168,0.12)] border border-[rgba(42,102,168,0.30)] rounded-[9px]" />
          <span className="absolute -left-[14px] top-[9px] bottom-[9px] w-[3px] bg-teal rounded-r-[3px]" />
        </>
      ) : null}
      <span className="relative z-[1] flex items-center gap-[11px] w-full">
        <Icon name={item.icon} className="text-[18px] text-ink-2 w-[18px]" />
        <span className="font-hanken text-[13.5px] font-medium text-ink">{item.label}</span>
        <span className="ml-auto font-mono text-[9.5px] font-medium text-ink-3">{item.count}</span>
      </span>
    </Link>
  );
}
