// Count-guard verdict logic — the "ieri 2.000 righe, oggi 0 → alert" protection.
import { expect, test } from "vitest";
import { guardVerdict } from "@/lib/data/ingest/framework";

test("guardVerdict flags empty (prev>0 → 0)", () => {
  expect(guardVerdict(2000, 0)).toBe("empty");
});

test("guardVerdict flags a severe drop (>50%)", () => {
  expect(guardVerdict(654, 300)).toBe("drop"); // 300 < 327
});

test("guardVerdict allows a moderate change", () => {
  expect(guardVerdict(654, 364)).toBe("ok"); // 44% drop, not an alert
  expect(guardVerdict(654, 700)).toBe("ok"); // growth
});

test("guardVerdict is 'first' with no prior", () => {
  expect(guardVerdict(null, 654)).toBe("first");
  expect(guardVerdict(0, 654)).toBe("first");
});
