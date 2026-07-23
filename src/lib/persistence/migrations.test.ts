import { describe, it, expect } from "vitest";
import { migrateProject } from "./migrations";
import { deepMerge, DELETE } from "@/lib/chart/deepMerge";
import type { ProjectDocument } from "@/types/project";

const legacyBinding = {
  id: "b1",
  datasetId: "ds1",
  chartType: "bar",
  xAxisColumnId: "c_month",
  series: [{ id: "s1", columnId: "c_rev", name: "Revenue" }],
  pieNameColumnId: null,
  pieValueColumnId: null,
};

function legacyDoc(): Record<string, unknown> {
  return {
    id: "p1",
    version: "1.0.0",
    metadata: {
      name: "Legacy",
      createdAt: "2020-01-01T00:00:00.000Z",
      updatedAt: "2020-01-01T00:00:00.000Z",
      tags: [],
      schemaVersion: "1.0.0",
    },
    datasets: [{ id: "ds1", name: "d", columns: [], rows: [], createdAt: "x", updatedAt: "x" }],
    bindings: [legacyBinding],
    transforms: [],
    chart: {
      option: { title: { text: "Legacy Title" } },
      renderer: "canvas",
    },
  };
}

describe("migrateProject", () => {
  it("migrates a 1.0.0 document to the current 2.1.0 schema", () => {
    const migrated = migrateProject(legacyDoc());
    expect(migrated.metadata.schemaVersion).toBe("2.1.0");
    expect(migrated.chart.binding).toEqual(legacyBinding);
    expect(migrated.chart.overrides).toEqual({ title: { text: "Legacy Title" } });
    expect(migrated.chart.renderer).toBe("canvas");
    // Legacy top-level fields are gone.
    expect((migrated as unknown as Record<string, unknown>).bindings).toBeUndefined();
    expect((migrated.chart as unknown as Record<string, unknown>).option).toBeUndefined();
  });

  it("defaults overrides to an empty object when chart.option was absent", () => {
    const doc = legacyDoc();
    delete (doc.chart as Record<string, unknown>).option;
    const migrated = migrateProject(doc);
    expect(migrated.chart.overrides).toEqual({});
  });

  it("handles a legacy document with no bindings", () => {
    const doc = legacyDoc();
    doc.bindings = [];
    const migrated = migrateProject(doc);
    expect(migrated.chart.binding).toBeUndefined();
  });

  it("is idempotent for a document already at 2.1.0", () => {
    const migratedOnce = migrateProject(legacyDoc());
    const migratedTwice = migrateProject(migratedOnce as unknown as Record<string, unknown>);
    expect(migratedTwice).toEqual(migratedOnce);
  });

  it("throws on a non-object input", () => {
    expect(() => migrateProject(null)).toThrow();
    expect(() => migrateProject("nope")).toThrow();
  });

  it("preserves a migrated project round-trip through JSON (save → load)", () => {
    const project: ProjectDocument = migrateProject(legacyDoc());
    const serialized = JSON.parse(JSON.stringify(project)) as Record<string, unknown>;
    const reloaded = migrateProject(serialized);
    expect(reloaded).toEqual(project);
  });

  it("converts legacy null-as-delete in overrides to the DELETE sentinel (2.0.0 → 2.1.0)", () => {
    const doc = {
      id: "p1",
      version: "2.0.0",
      metadata: { name: "v2", tags: [], schemaVersion: "2.0.0" },
      datasets: [{ id: "ds1", name: "d", columns: [], rows: [], createdAt: "x", updatedAt: "x" }],
      transforms: [],
      chart: {
        binding: legacyBinding,
        // 2.0.0 semantics: null meant "delete this property".
        overrides: { legend: null, series: [{ itemStyle: { color: "#f00" } }] },
        renderer: "canvas",
      },
    };
    const migrated = migrateProject(doc);
    expect(migrated.metadata.schemaVersion).toBe("2.1.0");
    const overrides = migrated.chart.overrides as Record<string, unknown>;
    expect(overrides.legend).toBe(DELETE);
    // Non-null values are untouched.
    expect(overrides.series).toEqual([{ itemStyle: { color: "#f00" } }]);
  });

  it("does NOT convert nulls for a document already at 2.1.0 (null is a real value)", () => {
    const doc = {
      id: "p1",
      version: "2.1.0",
      metadata: { name: "v21", tags: [], schemaVersion: "2.1.0" },
      datasets: [],
      transforms: [],
      chart: {
        overrides: { yAxis: { min: null }, series: [{ data: [1, null, 3] }] },
        renderer: "canvas",
      },
    };
    const migrated = migrateProject(doc);
    const overrides = migrated.chart.overrides as Record<string, unknown>;
    expect((overrides.yAxis as Record<string, unknown>).min).toBeNull();
    expect((overrides.series as Array<Record<string, unknown>>)[0].data).toEqual([1, null, 3]);
  });

  it("migrates the full chain 1.0.0 → 2.1.0 with a legacy delete in the option", () => {
    const doc = legacyDoc();
    (doc.chart as Record<string, unknown>).option = { title: { text: "T" }, legend: null };
    const migrated = migrateProject(doc);
    expect(migrated.metadata.schemaVersion).toBe("2.1.0");
    const overrides = migrated.chart.overrides as Record<string, unknown>;
    expect(overrides.legend).toBe(DELETE);
    // The DELETE sentinel actually removes `legend` when merged onto a base.
    const merged = deepMerge({ legend: { show: true }, title: { text: "base" } }, overrides);
    expect(merged.legend).toBeUndefined();
    expect(merged.title).toEqual({ text: "T" });
  });
});
