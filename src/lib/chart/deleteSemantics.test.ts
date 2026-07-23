import { describe, it, expect } from "vitest";
import { deepMerge, DELETE } from "./deepMerge";
import { computeOverrides } from "./computeOverrides";

/** Assert the diff is representable and round-trips exactly to `edited`. */
function expectRoundTrip(
  base: Record<string, unknown>,
  edited: Record<string, unknown>,
): Record<string, unknown> {
  const diff = computeOverrides(base, edited);
  expect(diff).not.toBeNull();
  expect(deepMerge(base, diff as Record<string, unknown>)).toEqual(edited);
  return diff as Record<string, unknown>;
}

describe("deletion semantics via the DELETE sentinel", () => {
  it("A — deleting a trailing series", () => {
    expectRoundTrip(
      { series: [{ type: "bar", data: [1, 2] }, { type: "bar", data: [3, 4] }] },
      { series: [{ type: "bar", data: [1, 2] }] },
    );
  });

  it("B — shortening the palette", () => {
    expectRoundTrip(
      { color: ["#a", "#b", "#c", "#d", "#e"], series: [{ type: "bar", data: [1] }] },
      { color: ["#f00"], series: [{ type: "bar", data: [1] }] },
    );
  });

  it("C — a legitimately null value (yAxis.min: null = auto)", () => {
    expectRoundTrip({ yAxis: { min: 0 } }, { yAxis: { min: null } });
  });

  it("keeps null gaps inside a data array through diff → merge", () => {
    const base = { series: [{ type: "line", data: [1, 2, 3] }] };
    const edited = { series: [{ type: "line", data: [1, null, 3] }] };
    const merged = expectRoundTrip(base, edited);
    // Sanity: the gap is preserved literally.
    const series = deepMerge(base, merged).series as Array<Record<string, unknown>>;
    expect(series[0].data).toEqual([1, null, 3]);
  });

  it("deletes an element in the middle of a three-series array", () => {
    const s = (n: number) => ({ type: "bar", name: `s${n}`, data: [n] });
    expectRoundTrip({ series: [s(0), s(1), s(2)] }, { series: [s(0), s(2)] });
  });

  it("deletes a deeply nested property (tooltip.axisPointer.type)", () => {
    const base = { tooltip: { trigger: "axis", axisPointer: { type: "shadow", z: 1 } } };
    const edited = { tooltip: { trigger: "axis", axisPointer: { z: 1 } } };
    const diff = expectRoundTrip(base, edited);
    // The removal is expressed with the sentinel, not by dropping the key.
    const axisPointer = ((diff.tooltip as Record<string, unknown>).axisPointer) as Record<string, unknown>;
    expect(axisPointer.type).toBe(DELETE);
  });

  it("merges: a trailing DELETE truncates the array", () => {
    const merged = deepMerge({ color: ["a", "b", "c"] }, { color: ["a", DELETE, DELETE] });
    expect(merged.color).toEqual(["a"]);
  });

  it("merges: a DELETE in the middle removes that element and shifts the rest", () => {
    const merged = deepMerge(
      { series: [{ a: 1 }, { a: 2 }, { a: 3 }] },
      { series: [DELETE, {}, {}] },
    );
    expect(merged.series).toEqual([{ a: 2 }, { a: 3 }]);
  });

  it("merges: DELETE removes an object property, null does not", () => {
    expect(deepMerge({ x: 1, y: 2 }, { x: DELETE })).toEqual({ y: 2 });
    expect(deepMerge({ x: 1, y: 2 }, { x: null })).toEqual({ x: null, y: 2 });
  });
});
