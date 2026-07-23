import { describe, it, expect } from "vitest";
import { datasetToOption } from "./datasetToOption";
import type { DatasetDocument, DatasetBinding } from "@/types/project";

function dataset(rows: DatasetDocument["rows"]): DatasetDocument {
  return {
    id: "ds1",
    name: "d",
    columns: [
      { id: "c_cat", name: "category", type: "string" },
      { id: "c_a", name: "a", type: "number" },
      { id: "c_b", name: "b", type: "number" },
    ],
    rows,
    createdAt: "x",
    updatedAt: "x",
  };
}

const rows = [
  { id: "r1", values: { c_cat: "X", c_a: 10, c_b: 5 } },
  { id: "r2", values: { c_cat: "Y", c_a: 20, c_b: 15 } },
];

function cartesianBinding(chartType: DatasetBinding["chartType"]): DatasetBinding {
  return {
    id: "b1",
    datasetId: "ds1",
    chartType,
    xAxisColumnId: "c_cat",
    series: [
      { id: "s1", columnId: "c_a", name: "A" },
      { id: "s2", columnId: "c_b", name: "B" },
    ],
    pieNameColumnId: null,
    pieValueColumnId: null,
  };
}

describe("datasetToOption", () => {
  for (const type of ["bar", "line", "scatter"] as const) {
    it(`builds a cartesian option for ${type}`, () => {
      const opt = datasetToOption(dataset(rows), cartesianBinding(type)) as Record<string, unknown>;
      const series = opt.series as Array<Record<string, unknown>>;
      expect(series).toHaveLength(2);
      expect(series[0].type).toBe(type);
      expect(series[0].data).toEqual([10, 20]);
      expect(series[1].data).toEqual([5, 15]);
      expect((opt.xAxis as Record<string, unknown>).data).toEqual(["X", "Y"]);
    });
  }

  it("builds a pie option", () => {
    const binding: DatasetBinding = {
      ...cartesianBinding("pie"),
      pieNameColumnId: "c_cat",
      pieValueColumnId: "c_a",
    };
    const opt = datasetToOption(dataset(rows), binding) as Record<string, unknown>;
    const series = opt.series as Array<Record<string, unknown>>;
    expect(series[0].type).toBe("pie");
    const data = series[0].data as Array<Record<string, unknown>>;
    expect(data.map((d) => d.name)).toEqual(["X", "Y"]);
    expect(data.map((d) => d.value)).toEqual([10, 20]);
  });

  it("builds a radar option", () => {
    const opt = datasetToOption(dataset(rows), cartesianBinding("radar")) as Record<string, unknown>;
    const series = opt.series as Array<Record<string, unknown>>;
    expect(series[0].type).toBe("radar");
    expect(opt.radar).toBeDefined();
  });

  it("handles an empty dataset", () => {
    const opt = datasetToOption(dataset([]), cartesianBinding("bar")) as Record<string, unknown>;
    const series = opt.series as Array<Record<string, unknown>>;
    expect(series[0].data).toEqual([]);
    expect((opt.xAxis as Record<string, unknown>).data).toEqual([]);
  });

  it("coerces non-numeric values in a numeric series to 0", () => {
    const badRows = [{ id: "r1", values: { c_cat: "X", c_a: "not a number", c_b: 5 } }];
    const opt = datasetToOption(dataset(badRows), cartesianBinding("bar")) as Record<string, unknown>;
    const series = opt.series as Array<Record<string, unknown>>;
    expect(series[0].data).toEqual([0]);
  });

  it("yields empty data for a series referencing a deleted column", () => {
    const binding: DatasetBinding = {
      ...cartesianBinding("bar"),
      series: [{ id: "s1", columnId: "c_deleted", name: "Missing" }],
    };
    const opt = datasetToOption(dataset(rows), binding) as Record<string, unknown>;
    const series = opt.series as Array<Record<string, unknown>>;
    expect(series[0].data).toEqual([]);
  });
});
