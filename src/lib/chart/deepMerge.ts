import { isPlainObject, clone } from "./deepEqual";

/**
 * Deep-merge `override` onto `base`, producing the effective ECharts option.
 *
 * Merge rules (see the refactor spec, phase 1.2):
 *  - Plain objects merge recursively.
 *  - Arrays merge **by index** (never element-by-element concatenation): an
 *    override on `series[0].itemStyle.color` must not wipe the `series[0].data`
 *    generated from the dataset. Base elements past the override's length are
 *    kept; extra override elements are appended.
 *  - An explicit `null` in the override means "remove this property".
 *  - Neither `base` nor `override` is mutated. Untouched `base` subtrees are
 *    referenced as-is (callers pass a freshly generated base, so this is safe
 *    and avoids cloning large dataset-derived arrays); values coming from the
 *    override are deep-cloned so the stored overrides object never leaks into
 *    the render tree.
 */
export function deepMerge(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  return mergeObject(base, override);
}

function mergeValue(base: unknown, override: unknown): unknown {
  if (Array.isArray(base) && Array.isArray(override)) return mergeArray(base, override);
  if (isPlainObject(base) && isPlainObject(override)) return mergeObject(base, override);
  // Primitive, or a type mismatch: the override replaces the base value.
  return clone(override);
}

function mergeObject(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base };
  for (const key of Object.keys(override)) {
    const ov = override[key];
    if (ov === null) {
      delete result[key];
    } else if (key in result) {
      result[key] = mergeValue(result[key], ov);
    } else {
      result[key] = clone(ov);
    }
  }
  return result;
}

function mergeArray(base: unknown[], override: unknown[]): unknown[] {
  const length = Math.max(base.length, override.length);
  const result: unknown[] = [];
  for (let i = 0; i < length; i++) {
    const b = i < base.length ? base[i] : undefined;
    const o = i < override.length ? override[i] : undefined;
    if (i >= override.length) {
      result[i] = b; // no override at this index → keep base element
    } else if (o === null) {
      result[i] = null; // explicit null element
    } else if (b === undefined) {
      result[i] = clone(o);
    } else {
      result[i] = mergeValue(b, o);
    }
  }
  return result;
}
