// ISTAT SDMX-JSON parse tests. The parser flattens nested series/observations and
// must support both the 1.0 (root) and 2.0 (nested `data`) message shapes, and
// flag provisional observations (obs arrays with an extra attribute element).
import { expect, test } from "vitest";
import {
  parseSdmxJson,
  latest,
  latestDefinitive,
  sumBrackets,
  type SdmxJsonMessage,
} from "@/lib/data/adapters/sources/istat";

// Two series (AGE_CLASS Y15-19 and Y65-69) over three years; the 2024 Y15-19 obs
// is provisional (a second element in the observation array).
const CORE = {
  structure: {
    dimensions: {
      series: [
        { id: "REF_AREA", values: [{ id: "088009" }] },
        { id: "AGE_CLASS", values: [{ id: "Y15-19" }, { id: "Y65-69" }] },
      ],
      observation: [{ id: "TIME_PERIOD", values: [{ id: "2022" }, { id: "2023" }, { id: "2024" }] }],
    },
  },
  dataSets: [
    {
      series: {
        "0:0": { observations: { "0": [100], "1": [110], "2": [120, "prov"] } },
        "0:1": { observations: { "0": [50] } },
      },
    },
  ],
};

test("parseSdmxJson flattens series + observations with dimension ids resolved", () => {
  const obs = parseSdmxJson(CORE as unknown as SdmxJsonMessage);
  expect(obs).toHaveLength(4);
  const y1519 = obs.filter((o) => o.seriesDims.AGE_CLASS === "Y15-19");
  expect(y1519.map((o) => [o.time, o.value])).toEqual([
    ["2022", 100],
    ["2023", 110],
    ["2024", 120],
  ]);
  expect(y1519.find((o) => o.time === "2024")!.provisional).toBe(true);
  expect(obs.every((o) => o.seriesDims.REF_AREA === "088009")).toBe(true);
});

test("latest vs latestDefinitive respect the provisional flag", () => {
  const obs = parseSdmxJson(CORE as unknown as SdmxJsonMessage).filter(
    (o) => o.seriesDims.AGE_CLASS === "Y15-19",
  );
  expect(latest(obs)!.time).toBe("2024"); // newest overall (provisional)
  expect(latestDefinitive(obs)!.time).toBe("2023"); // newest non-provisional
});

test("sumBrackets totals the values across matching age classes", () => {
  const obs = parseSdmxJson(CORE as unknown as SdmxJsonMessage);
  expect(sumBrackets(obs, ["Y15-19"])).toBe(330); // 100+110+120
  expect(sumBrackets(obs, ["Y65-69"])).toBe(50);
  expect(sumBrackets(obs, ["Y99-99"])).toBe(0);
});

test("parseSdmxJson also accepts the 2.0 nested `data` shape", () => {
  const nested = { data: CORE } as unknown as SdmxJsonMessage;
  expect(parseSdmxJson(nested)).toHaveLength(4);
});

test("parseSdmxJson returns [] for an empty/malformed message", () => {
  expect(parseSdmxJson({} as SdmxJsonMessage)).toEqual([]);
});
