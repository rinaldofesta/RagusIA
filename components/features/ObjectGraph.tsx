"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/primitives/kit";
import { useProvenance } from "@/components/primitives/provenance";
import type { GraphLink, GraphNode, GraphTypeMeta } from "@/lib/model/types";

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function ObjectGraph({
  nodes,
  links,
  types,
  W,
  H,
}: {
  nodes: GraphNode[];
  links: GraphLink[];
  types: GraphTypeMeta[];
  W: number;
  H: number;
}) {
  const router = useRouter();
  const { open } = useProvenance();

  const [filter, setFilter] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [gz, setGz] = useState(0.62);
  const [gx, setGx] = useState(0);
  const [gy, setGy] = useState(0);

  // Adjacency built from links: undirected (both directions).
  const adj = useMemo(() => {
    const a: Record<string, Set<string>> = {};
    links.forEach((e) => {
      (a[e.from] = a[e.from] || new Set()).add(e.to);
      (a[e.to] = a[e.to] || new Set()).add(e.from);
    });
    return a;
  }, [links]);

  const near = (id: string) => !hover || hover === id || !!adj[hover]?.has(id);

  // ---- Pan (drag the background) ----
  const panRef = useRef<{
    x: number;
    y: number;
    gx: number;
    gy: number;
    move: (ev: MouseEvent) => void;
    up: () => void;
  } | null>(null);

  function startPan(e: React.MouseEvent) {
    if (e.button !== 0) return;
    const move = (ev: MouseEvent) => {
      const p = panRef.current;
      if (!p) return;
      setGx(p.gx + (ev.clientX - p.x));
      setGy(p.gy + (ev.clientY - p.y));
    };
    const up = () => {
      const p = panRef.current;
      if (p) {
        window.removeEventListener("mousemove", p.move);
        window.removeEventListener("mouseup", p.up);
      }
      panRef.current = null;
    };
    panRef.current = { x: e.clientX, y: e.clientY, gx, gy, move, up };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  }

  function onWheelZoom(e: React.WheelEvent) {
    const f = e.deltaY < 0 ? 1.1 : 0.91;
    setGz((z) => clamp(z * f, 0.3, 2.4));
  }

  const zoomIn = () => setGz((z) => Math.min(2.4, z * 1.2));
  const zoomOut = () => setGz((z) => Math.max(0.3, z * 0.82));
  const zoomReset = () => {
    setGz(0.62);
    setGx(0);
    setGy(0);
  };

  const zoomPct = Math.round(gz * 100) + "%";
  const hasFilter = !!filter;

  return (
    <div
      className="absolute inset-0 flex"
      style={{ background: "#1F1B16", color: "#EDE6D8" }}
    >
      {/* ---------------- Left sidebar : object types ---------------- */}
      <aside
        className="w-[250px] flex-none flex flex-col"
        style={{
          borderRight: "1px solid rgba(237,230,216,0.09)",
          background: "#1B1712",
        }}
      >
        <div
          className="px-[18px] pt-[18px] pb-[14px]"
          style={{ borderBottom: "1px solid rgba(237,230,216,0.08)" }}
        >
          <div
            className="font-mono text-[9.5px] font-semibold uppercase mb-1"
            style={{ letterSpacing: "0.14em", color: "#D89A3E" }}
          >
            Tipi di oggetto
          </div>
          <div className="font-hanken text-[11px]" style={{ color: "#A89D88" }}>
            17 tipi · clicca per filtrare
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-[10px] py-2">
          {types.map((t) => {
            const active = filter === t.id;
            const rowOp = !filter || t.id === filter ? 1 : 0.45;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilter((f) => (f === t.id ? null : t.id))}
                className="relative flex items-center gap-[10px] w-full px-[9px] py-[7px] rounded-[8px] border border-transparent bg-transparent cursor-pointer text-left mb-px transition-colors hover:bg-[rgba(237,230,216,0.05)]"
                style={{ opacity: rowOp }}
              >
                {active && (
                  <span
                    className="absolute"
                    style={{
                      width: 3,
                      height: 16,
                      background: "#D89A3E",
                      borderRadius: 2,
                      marginLeft: -9,
                    }}
                  />
                )}
                <span
                  className="flex-none"
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: 3,
                    background: t.color,
                  }}
                />
                <span
                  className="flex-1 font-hanken text-[12px] font-medium"
                  style={{ color: "#EDE6D8" }}
                >
                  {t.label}
                </span>
                <span
                  className="font-mono text-[10px] font-medium"
                  style={{ color: "#8C8270" }}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* ---------------- Canvas ---------------- */}
      <div
        className="flex-1 relative overflow-hidden"
        style={{
          backgroundImage:
            "radial-gradient(rgba(237,230,216,0.05) 1px,transparent 1px)",
          backgroundSize: "26px 26px",
        }}
      >
        {/* Sticky header */}
        <div
          className="sticky top-0 z-20 flex items-center gap-[14px] px-[22px] py-4"
          style={{
            background: "linear-gradient(180deg,#1F1B16,rgba(31,27,22,0.0))",
            pointerEvents: "none",
          }}
        >
          <div style={{ pointerEvents: "auto" }}>
            <div className="flex items-center gap-[9px]">
              <h1
                className="font-spectral text-[20px] font-medium m-0"
                style={{ color: "#F2EBDD" }}
              >
                Esplora
              </h1>
              <span
                className="font-mono text-[8.5px] font-semibold uppercase rounded-[5px] px-[7px] py-[3px]"
                style={{
                  letterSpacing: "0.12em",
                  color: "#1F1B16",
                  background: "#D89A3E",
                }}
              >
                modalità inchiostro
              </span>
            </div>
            <div
              className="font-hanken text-[11.5px] mt-[3px]"
              style={{ color: "#A89D88" }}
            >
              L&apos;intero modello del Comune ·{" "}
              <span style={{ color: "#CFC4AE" }}>
                trascina per spostarti, scorri per lo zoom, passa su un nodo per
                evidenziare
              </span>
            </div>
          </div>
          <div
            className="ml-auto flex items-center gap-[9px]"
            style={{ pointerEvents: "auto" }}
          >
            {hasFilter && (
              <button
                type="button"
                onClick={() => setFilter(null)}
                className="inline-flex items-center gap-[6px] rounded-[9px] px-3 py-2 font-hanken text-[11.5px] font-medium cursor-pointer transition-colors hover:bg-[rgba(237,230,216,0.1)]"
                style={{
                  background: "rgba(237,230,216,0.06)",
                  border: "1px solid rgba(237,230,216,0.14)",
                  color: "#EDE6D8",
                }}
              >
                <Icon name="ph-funnel-x" className="text-[14px]" /> Togli filtro
              </button>
            )}
            <div
              className="inline-flex items-center rounded-[9px] overflow-hidden"
              style={{
                background: "rgba(237,230,216,0.06)",
                border: "1px solid rgba(237,230,216,0.14)",
              }}
            >
              <button
                type="button"
                onClick={zoomOut}
                className="flex border-none bg-transparent cursor-pointer px-[11px] py-2 transition-colors hover:bg-[rgba(237,230,216,0.1)]"
                style={{ color: "#EDE6D8" }}
              >
                <Icon name="ph-minus" className="text-[13px]" />
              </button>
              <button
                type="button"
                onClick={zoomReset}
                className="bg-transparent cursor-pointer px-2 py-2 font-mono text-[10.5px] font-semibold min-w-[48px] transition-colors hover:bg-[rgba(237,230,216,0.1)]"
                style={{
                  borderLeft: "1px solid rgba(237,230,216,0.12)",
                  borderRight: "1px solid rgba(237,230,216,0.12)",
                  borderTop: "none",
                  borderBottom: "none",
                  color: "#CFC4AE",
                }}
              >
                {zoomPct}
              </button>
              <button
                type="button"
                onClick={zoomIn}
                className="flex border-none bg-transparent cursor-pointer px-[11px] py-2 transition-colors hover:bg-[rgba(237,230,216,0.1)]"
                style={{ color: "#EDE6D8" }}
              >
                <Icon name="ph-plus" className="text-[13px]" />
              </button>
            </div>
          </div>
        </div>

        {/* Pan/zoom background */}
        <div
          onMouseDown={startPan}
          onWheel={onWheelZoom}
          className="absolute inset-0 z-[1]"
          style={{ cursor: "grab" }}
        >
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              width: W,
              height: H,
              transform: `translate(-50%,-50%) translate(${gx}px,${gy}px) scale(${gz})`,
              transformOrigin: "center center",
            }}
          >
            {/* Edges */}
            {links.map((e, i) => {
              const a = e.A,
                b = e.B;
              const dx = b.cx - a.cx,
                dy = b.cy - a.cy;
              const len = Math.hypot(dx, dy);
              const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
              const onF = !filter || a.type === filter || b.type === filter;
              const onH = !hover || e.from === hover || e.to === hover;
              const bright = !!(hover && (e.from === hover || e.to === hover));
              let op = onF ? 0.4 : 0.05;
              if (hover && !onH) op = 0.04;
              const col = bright
                ? "rgba(216,154,62,0.85)"
                : "rgba(237,230,216,0.16)";
              return (
                <div
                  key={`edge-${i}`}
                  className="absolute"
                  style={{
                    left: a.cx,
                    top: a.cy,
                    width: len,
                    height: 0,
                    borderTop: `1.5px ${e.dashed ? "dashed" : "solid"} ${col}`,
                    transformOrigin: "0 0",
                    transform: `rotate(${angle}deg)`,
                    opacity: op,
                  }}
                />
              );
            })}

            {/* Relation labels */}
            {links.map((e, i) => {
              if (!e.label) return null;
              const a = e.A,
                b = e.B;
              const mx = (a.cx + b.cx) / 2,
                my = (a.cy + b.cy) / 2;
              const bright = !!(hover && (e.from === hover || e.to === hover));
              const lblOp = hover ? (bright ? 1 : 0.04) : 0.66;
              return (
                <div
                  key={`lbl-${i}`}
                  className="absolute font-mono text-[8.5px] font-medium whitespace-nowrap"
                  style={{
                    left: mx,
                    top: my,
                    transform: "translate(-50%,-50%)",
                    opacity: lblOp,
                    color: "#C9BEA5",
                    background: "#211C16",
                    padding: "1px 6px",
                    borderRadius: 4,
                    border: "1px solid rgba(237,230,216,0.1)",
                    pointerEvents: "none",
                  }}
                >
                  {e.label}
                </div>
              );
            })}

            {/* Nodes */}
            {nodes.map((n) => {
              const typeOn = !filter || n.type === filter;
              let op = typeOn ? 1 : 0.12;
              if (hover && !near(n.id)) op = Math.min(op, 0.07);
              const lit = !!(hover && (hover === n.id || adj[hover]?.has(n.id)));
              const isHub = n.tier !== "leaf";
              const diam = Math.round(n.r * 2);
              const fontSize =
                n.tier === "center" ? 13.5 : n.tier === "hub" ? 11 : 9;
              const ring = lit
                ? "#F4EFE6"
                : isHub
                  ? "rgba(237,230,216,0.30)"
                  : "rgba(20,17,13,0.65)";
              const glow = lit
                ? `0 0 0 2px ${n.color}, 0 0 22px -1px ${n.color}`
                : isHub
                  ? "0 3px 12px rgba(0,0,0,0.45)"
                  : "none";
              const labOp = hover
                ? lit
                  ? 1
                  : 0.05
                : isHub
                  ? 0.96
                  : filter
                    ? typeOn
                      ? 0.92
                      : 0.05
                    : 0.6;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    if (n.serviceId) router.push("/chiedi?qa=" + n.serviceId);
                    else if (n.sourceId)
                      open(n.sourceId, "Attestazione nel grafo");
                    else if (n.entityId) router.push("/entita/" + n.entityId);
                  }}
                  onMouseEnter={() => setHover(n.id)}
                  onMouseLeave={() => setHover(null)}
                  className="absolute border-none bg-transparent cursor-pointer p-0"
                  style={{
                    left: n.cx,
                    top: n.cy,
                    transform: "translate(-50%,-50%)",
                    opacity: op,
                  }}
                >
                  <span
                    className="block rounded-full"
                    style={{
                      width: diam,
                      height: diam,
                      background: n.color,
                      border: `2px solid ${ring}`,
                      boxShadow: glow,
                    }}
                  />
                  <span
                    className="absolute left-1/2 whitespace-nowrap font-hanken font-semibold"
                    style={{
                      top: diam + 3,
                      transform: "translateX(-50%)",
                      opacity: labOp,
                      fontSize,
                      color: "#F1EADC",
                      textShadow: "0 1px 5px rgba(0,0,0,0.9)",
                      pointerEvents: "none",
                    }}
                  >
                    {n.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
