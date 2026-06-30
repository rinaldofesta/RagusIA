import { expect, test } from "vitest";
import { buildGraph } from "@/lib/graph/layout";
import type { GraphModel } from "@/lib/model/types";

const model: GraphModel = {
  center: { id: "comune", type: "organi", label: "Comune di Ragusa" },
  clusters: [
    {
      hub: { id: "h-governo", type: "organi", label: "Governo" },
      leaves: [
        { id: "sindaco", type: "persone", label: "Sindaco" },
        { id: "giunta", type: "persone", label: "Giunta" },
      ],
    },
    {
      hub: { id: "h-bilancio", type: "capitoli", label: "Bilancio" },
      leaves: [
        { id: "cap1", type: "capitoli", label: "Capitolo 1" },
        { id: "cap2", type: "capitoli", label: "Capitolo 2" },
      ],
    },
  ],
  cross: [{ from: "sindaco", to: "h-governo", label: "guida" }],
};

const colors: Record<string, string> = {
  organi: "#D89A3E",
  persone: "#6FA3BC",
  capitoli: "#C2A35A",
};

test("buildGraph places center at CX/CY with tier center", () => {
  const { nodes } = buildGraph(model, colors);
  const center = nodes.find((n) => n.id === "comune")!;
  expect(center.cx).toBe(680);
  expect(center.cy).toBe(470);
  expect(center.tier).toBe("center");
});

test("buildGraph produces expected node count", () => {
  const { nodes } = buildGraph(model, colors);
  const expected =
    1 + model.clusters.reduce((sum, c) => sum + 1 + c.leaves.length, 0);
  expect(nodes.length).toBe(expected);
});

test("buildGraph places every hub at distance ~252 from center", () => {
  const { nodes } = buildGraph(model, colors);
  const center = nodes.find((n) => n.id === "comune")!;
  const hubs = nodes.filter((n) => n.tier === "hub");
  expect(hubs.length).toBe(model.clusters.length);
  hubs.forEach((hub) => {
    const dist = Math.hypot(hub.cx - center.cx, hub.cy - center.cy);
    expect(Math.abs(dist - 252)).toBeLessThanOrEqual(0.5);
  });
});

test("buildGraph produces expected link count, including resolved cross links", () => {
  const { links } = buildGraph(model, colors);
  const expectedClusterLinks = model.clusters.reduce(
    (sum, c) => sum + 1 + c.leaves.length,
    0
  );
  const expectedCrossLinks = model.cross.length; // both endpoints exist
  expect(links.length).toBe(expectedClusterLinks + expectedCrossLinks);
});

test("buildGraph skips cross links with missing endpoints", () => {
  const modelWithBadCross: GraphModel = {
    ...model,
    cross: [
      ...model.cross,
      { from: "sindaco", to: "does-not-exist", label: "x" },
    ],
  };
  const { links } = buildGraph(modelWithBadCross, colors);
  const expectedClusterLinks = model.clusters.reduce(
    (sum, c) => sum + 1 + c.leaves.length,
    0
  );
  expect(links.length).toBe(expectedClusterLinks + 1); // only the valid cross link
});
