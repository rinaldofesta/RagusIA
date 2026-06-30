// Ported verbatim from the prototype (design/reference/Ragusia.dc.html),
// the `_buildGraph` method, ~lines 1393-1414.

import type { GraphLink, GraphModel, GraphNode } from "@/lib/model/types";

export function buildGraph(
  model: GraphModel,
  colors: Record<string, string>
): { nodes: GraphNode[]; links: GraphLink[]; W: number; H: number } {
  const W = 1360,
    H = 940,
    CX = 680,
    CY = 470;
  const colorOf = (t: string) => colors[t] || "#9A8F78";
  const nodes: GraphNode[] = [];
  const byId: Record<string, GraphNode> = {};
  const add = (n: GraphNode) => {
    n.color = colorOf(n.type);
    nodes.push(n);
    byId[n.id] = n;
  };

  add({
    ...model.center,
    cx: CX,
    cy: CY,
    r: 29,
    tier: "center",
  } as GraphNode);

  const cl = model.clusters,
    N = cl.length;
  cl.forEach((c, i) => {
    const a = -Math.PI / 2 + i * ((2 * Math.PI) / N),
      hubR = 252;
    const hx = CX + hubR * Math.cos(a),
      hy = CY + hubR * Math.sin(a);
    add({ ...c.hub, cx: hx, cy: hy, r: 15, tier: "hub" } as GraphNode);
    const K = c.leaves.length,
      leafR = 116,
      span = Math.min(Math.PI * 0.92, 0.42 * K + 0.5);
    c.leaves.forEach((lf, k) => {
      const off = K > 1 ? (k / (K - 1) - 0.5) * span : 0,
        la = a + off;
      add({
        ...lf,
        cx: hx + leafR * Math.cos(la),
        cy: hy + leafR * Math.sin(la),
        r: 9,
        tier: "leaf",
      } as GraphNode);
    });
  });

  const links: GraphLink[] = [];
  const link = (from: string, to: string, label: string, dashed?: boolean) => {
    const A = byId[from],
      B = byId[to];
    if (!A || !B) return;
    links.push({ from, to, label, dashed: !!dashed, A, B });
  };
  cl.forEach((c) => {
    link("comune", c.hub.id, "");
    c.leaves.forEach((lf) => link(c.hub.id, lf.id, ""));
  });
  model.cross.forEach((x) => link(x.from, x.to, x.label, x.dashed));

  return { nodes, links, W, H };
}
