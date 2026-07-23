import { isPlainObject } from "./deepEqual";

/**
 * Top-level option keys that the dataset binding *generates* — series, axes and
 * coordinate systems. When the chart type or the bound dataset changes, the base
 * for these keys is rebuilt from scratch, so any leftover override targeting them
 * (e.g. a whole `series` array from a previous template) would be index-merged
 * onto the new base and "intertwine" with it. These are pruned on such changes;
 * purely cosmetic overrides (title, colors, legend, tooltip, grid…) are kept.
 */
export const STRUCTURAL_OVERRIDE_KEYS: readonly string[] = [
  "series",
  "xAxis",
  "yAxis",
  "radar",
  "polar",
  "angleAxis",
  "radiusAxis",
  "singleAxis",
  "parallel",
  "parallelAxis",
  "dataset",
];

/**
 * Return a copy of `overrides` with the structural keys removed, so a chart-type
 * or source-dataset switch cannot leave stale series/axes merged on top of a
 * freshly generated base.
 */
export function pruneStructuralOverrides(
  overrides: Record<string, unknown>,
): Record<string, unknown> {
  const next: Record<string, unknown> = {};
  for (const key of Object.keys(overrides)) {
    if (STRUCTURAL_OVERRIDE_KEYS.includes(key)) continue;
    next[key] = overrides[key];
  }
  return next;
}

/**
 * A user-facing count of manual customizations: the number of leaf overrides
 * (primitive / array / sentinel values). Empty no-op objects — produced by the
 * override diff for unchanged array elements — are not counted.
 */
export function countOverrides(
  overrides: Record<string, unknown> | undefined | null,
): number {
  if (!overrides) return 0;
  let count = 0;
  const walk = (value: unknown) => {
    if (Array.isArray(value)) {
      // Descend so no-op `{}` placeholders (emitted by the override diff for
      // unchanged array elements) contribute nothing, while real edits count.
      for (const item of value) walk(item);
    } else if (isPlainObject(value)) {
      for (const key of Object.keys(value)) walk(value[key]);
    } else {
      // primitive, null, or DELETE sentinel → one customization
      count += 1;
    }
  };
  walk(overrides);
  return count;
}

export type ChartMode = "empty" | "bound" | "detached";

interface ChartModeInput {
  chart: { binding?: unknown; overrides: Record<string, unknown> };
}

/**
 * Which of the two mutually-exclusive states the chart is in:
 *  - `bound`: generated from a dataset binding (the normal case);
 *  - `detached`: no binding, but manual overrides drive the chart (e.g. after a
 *    template is applied);
 *  - `empty`: neither — nothing to render.
 */
export function getChartMode(project: ChartModeInput): ChartMode {
  if (project.chart.binding) return "bound";
  if (countOverrides(project.chart.overrides) > 0) return "detached";
  return "empty";
}
