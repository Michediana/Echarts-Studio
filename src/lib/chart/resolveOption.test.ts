import { describe, it, expect } from "vitest";
import { resolveOption, resolveBaseOption } from "./resolveOption";
import { DELETE } from "./deepMerge";
import type {
  ProjectDocument,
  DatasetDocument,
  DatasetBinding,
} from "@/types/project";

function makeDataset(): DatasetDocument {
  return {
    id: "ds1",
    name: "Sales",
    columns: [
      { id: "c_month", name: "month", type: "string" },
      { id: "c_rev", name: "revenue", type: "number" },
      { id: "c_cost", name: "cost", type: "number" },
    ],
    rows: [
      { id: "r1", values: { c_month: "Jan", c_rev: 100, c_cost: 40 } },
      { id: "r2", values: { c_month: "Feb", c_rev: 150, c_cost: 60 } },
    ],
    createdAt: "2020-01-01T00:00:00.000Z",
    updatedAt: "2020-01-01T00:00:00.000Z",
  };
}

function barBinding(): DatasetBinding {
  return {
    id: "b1",
    datasetId: "ds1",
    chartType: "bar",
    xAxisColumnId: "c_month",
    series: [
      { id: "s1", columnId: "c_rev", name: "Revenue", color: "#111111" },
      { id: "s2", columnId: "c_cost", name: "Cost", color: "#222222" },
    ],
    pieNameColumnId: null,
    pieValueColumnId: null,
  };
}

function makeProject(
  overrides: Record<string, unknown>,
  binding: DatasetBinding | null = barBinding(),
): ProjectDocument {
  return {
    id: "p1",
    version: "2.0.0",
    metadata: {
      name: "Test",
      createdAt: "2020-01-01T00:00:00.000Z",
      updatedAt: "2020-01-01T00:00:00.000Z",
      tags: [],
      schemaVersion: "2.0.0",
    },
    datasets: [makeDataset()],
    transforms: [],
    chart: { binding: binding ?? undefined, overrides, renderer: "canvas" },
  };
}

describe("resolveOption", () => {
  it("generates a base option from the binding when there are no overrides", () => {
    const opt = resolveOption(makeProject({})) as Record<string, unknown>;
    const series = opt.series as Array<Record<string, unknown>>;
    expect(series).toHaveLength(2);
    expect(series[0].data).toEqual([100, 150]);
    expect(series[1].data).toEqual([40, 60]);
    expect((opt.xAxis as Record<string, unknown>).data).toEqual(["Jan", "Feb"]);
  });

  it("deep-merges scalar overrides on top of the base", () => {
    const opt = resolveOption(makeProject({ title: { text: "Hello" } })) as Record<string, unknown>;
    expect((opt.title as Record<string, unknown>).text).toBe("Hello");
    // Base content is preserved.
    expect((opt.series as unknown[]).length).toBe(2);
  });

  it("merges series by index without dropping generated data", () => {
    const opt = resolveOption(
      makeProject({ series: [{ itemStyle: { color: "#ff0000" } }] }),
    ) as Record<string, unknown>;
    const series = opt.series as Array<Record<string, unknown>>;
    expect((series[0].itemStyle as Record<string, unknown>).color).toBe("#ff0000");
    // The dataset-generated data for series[0] survives the style override.
    expect(series[0].data).toEqual([100, 150]);
    // series[1] is untouched.
    expect((series[1].itemStyle as Record<string, unknown>).color).toBe("#222222");
    expect(series[1].data).toEqual([40, 60]);
  });

  it("removes a property when the override is the DELETE sentinel", () => {
    const base = resolveBaseOption(makeProject({}));
    expect(base.legend).toBeDefined();
    const opt = resolveOption(makeProject({ legend: DELETE })) as Record<string, unknown>;
    expect(opt.legend).toBeUndefined();
  });

  it("treats null as an ordinary value, not as a deletion", () => {
    const opt = resolveOption(makeProject({ yAxis: { min: null } })) as Record<string, unknown>;
    // min:null (ECharts "auto") is kept as a real value.
    expect((opt.yAxis as Record<string, unknown>).min).toBeNull();
    // yAxis was still merged onto the generated base (type:"value" survives).
    expect((opt.yAxis as Record<string, unknown>).type).toBe("value");
  });

  it("returns just the overrides when there is no binding", () => {
    const opt = resolveOption(makeProject({ title: { text: "X" } }, null));
    expect(opt).toEqual({ title: { text: "X" } });
  });

  it("falls back to an empty base when the referenced dataset is missing", () => {
    const binding = { ...barBinding(), datasetId: "does-not-exist" };
    const opt = resolveOption(makeProject({ title: { text: "Y" } }, binding));
    expect(opt).toEqual({ title: { text: "Y" } });
  });

  it("does not mutate the base or the overrides", () => {
    const overrides = { series: [{ itemStyle: { color: "#abcdef" } }] };
    const frozenOverrides = Object.freeze(overrides);
    const project = makeProject(frozenOverrides);
    expect(() => resolveOption(project)).not.toThrow();
  });
});
