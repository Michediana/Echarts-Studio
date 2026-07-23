import { describe, it, expect } from "vitest";
import {
  countOverrides,
  pruneStructuralOverrides,
  getChartMode,
} from "./overrideStatus";

describe("countOverrides", () => {
  it("counts leaf values, not container objects", () => {
    expect(countOverrides({})).toBe(0);
    expect(countOverrides({ title: { text: "Hi", left: "center" } })).toBe(2);
  });

  it("descends into arrays: no-op placeholders count 0, real leaves count", () => {
    expect(countOverrides({ series: [{}, {}] })).toBe(0);
    expect(countOverrides({ series: [{ itemStyle: { color: "red" } }, {}] })).toBe(1);
    expect(countOverrides({ color: ["#fff", "#000"] })).toBe(2);
    expect(countOverrides({ a: null, b: 3 })).toBe(2);
  });

  it("handles undefined/null overrides", () => {
    expect(countOverrides(undefined)).toBe(0);
    expect(countOverrides(null)).toBe(0);
  });
});

describe("pruneStructuralOverrides", () => {
  it("drops series/axes but keeps cosmetic overrides", () => {
    const pruned = pruneStructuralOverrides({
      title: { text: "Kept" },
      series: [{ itemStyle: { color: "red" } }],
      xAxis: { name: "x" },
      yAxis: { min: 0 },
      legend: { bottom: 0 },
    });
    expect(pruned).toEqual({
      title: { text: "Kept" },
      legend: { bottom: 0 },
    });
  });

  it("does not mutate the input", () => {
    const input = { series: [{}], title: { text: "a" } };
    pruneStructuralOverrides(input);
    expect(input.series).toBeDefined();
  });
});

describe("getChartMode", () => {
  it("is bound when a binding exists", () => {
    expect(getChartMode({ chart: { binding: { datasetId: "d" }, overrides: {} } })).toBe("bound");
  });

  it("is detached when overrides drive the chart without a binding", () => {
    expect(getChartMode({ chart: { overrides: { series: [{ type: "line" }] } } })).toBe("detached");
  });

  it("is empty with neither binding nor overrides", () => {
    expect(getChartMode({ chart: { overrides: {} } })).toBe("empty");
    expect(getChartMode({ chart: { overrides: { series: [{}] } } })).toBe("empty");
  });
});
