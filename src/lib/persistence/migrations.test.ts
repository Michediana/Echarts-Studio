import { describe, it, expect } from "vitest";
import { migrateProject } from "./migrations";
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
  it("migrates a 1.0.0 document to 2.0.0", () => {
    const migrated = migrateProject(legacyDoc());
    expect(migrated.metadata.schemaVersion).toBe("2.0.0");
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

  it("is idempotent for a document already at 2.0.0", () => {
    const migratedOnce = migrateProject(legacyDoc());
    const migratedTwice = migrateProject(migratedOnce as unknown as Record<string, unknown>);
    expect(migratedTwice).toEqual(migratedOnce);
  });

  it("throws on a non-object input", () => {
    expect(() => migrateProject(null)).toThrow();
    expect(() => migrateProject("nope")).toThrow();
  });

  it("preserves a 2.0.0 project round-trip through JSON (save → load)", () => {
    const project: ProjectDocument = migrateProject(legacyDoc());
    const serialized = JSON.parse(JSON.stringify(project)) as Record<string, unknown>;
    const reloaded = migrateProject(serialized);
    expect(reloaded).toEqual(project);
  });
});
