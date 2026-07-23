import { describe, it, expect, beforeEach, vi } from "vitest";

// The store imports Tauri's `invoke`; stub it so importing the store is safe in
// a plain Node test environment.
vi.mock("@tauri-apps/api/core", () => ({ invoke: vi.fn(async () => []) }));

import { useProjectStore } from "./projectStore";
import { resolveOption } from "@/lib/chart/resolveOption";

function project() {
  return useProjectStore.getState().currentProject!;
}
function resolved() {
  return resolveOption(project()) as Record<string, unknown>;
}

describe("projectStore — unified binding/overrides model", () => {
  beforeEach(() => {
    useProjectStore.getState().createProject();
  });

  it("overriding a series colour keeps the dataset data and the binding", () => {
    useProjectStore.getState().setOptionOverride("series[0].itemStyle.color", "#ff0000");
    expect(project().chart.binding).toBeDefined();

    const series = resolved().series as Array<Record<string, unknown>>;
    expect((series[0].itemStyle as Record<string, unknown>).color).toBe("#ff0000");
    expect((series[0].data as number[]).length).toBeGreaterThan(0);
  });

  it("editing a dataset cell updates the chart while preserving overrides", () => {
    const store = useProjectStore.getState();
    store.setOptionOverride("series[0].itemStyle.color", "#ff0000");

    const ds = project().datasets[0];
    const revCol = ds.columns.find((c) => c.name === "revenue")!;
    const newRows = ds.rows.map((r, i) =>
      i === 0 ? { ...r, values: { ...r.values, [revCol.id]: 99999 } } : r,
    );
    store.updateDataset(ds.id, { rows: newRows });

    const series = resolved().series as Array<Record<string, unknown>>;
    expect((series[0].data as number[])[0]).toBe(99999);
    expect((series[0].itemStyle as Record<string, unknown>).color).toBe("#ff0000");
  });

  it("setting a value equal to the generated default clears the override", () => {
    const store = useProjectStore.getState();
    store.setOptionOverride("series[0].name", "Custom");
    store.setOptionOverride("series[0].name", "Revenue"); // matches the binding-generated name

    const overrides = project().chart.overrides as Record<string, unknown>;
    const series = overrides.series as Array<Record<string, unknown>> | undefined;
    if (series && series[0]) expect(series[0].name).toBeUndefined();
  });

  it("supports undo/redo of an override", () => {
    const store = useProjectStore.getState();
    store.setOptionOverride("title.text", "AAA");
    expect(useProjectStore.getState().canUndo).toBe(true);

    store.undo();
    expect(((resolved().title as Record<string, unknown>).text)).toBe("Monthly Sales Overview");
    expect(useProjectStore.getState().canRedo).toBe(true);

    store.redo();
    expect(((resolved().title as Record<string, unknown>).text)).toBe("AAA");
  });

  it("applyTemplate detaches the binding explicitly", () => {
    useProjectStore.getState().applyTemplate({ title: { text: "T" } });
    expect(project().chart.binding).toBeUndefined();
    expect(resolveOption(project())).toEqual({ title: { text: "T" } });
  });

  it("clearBinding removes the generator", () => {
    useProjectStore.getState().clearBinding();
    expect(project().chart.binding).toBeUndefined();
  });
});
