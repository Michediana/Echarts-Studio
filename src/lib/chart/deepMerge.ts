import { isPlainObject, clone } from "./deepEqual";

/**
 * Sentinel that marks a property/element for deletion in an override.
 *
 * It is a **string** (not a `Symbol`) so it survives JSON serialisation of the
 * stored overrides. The value is deliberately improbable; in the pathological
 * case where a user's real string equals it, `computeOverrides`' re-merge
 * verification detects the mismatch and falls back to a wholesale override, so
 * correctness is preserved regardless.
 */
export const DELETE = "__echarts_studio_delete__";

/**
 * Deep-merge `override` onto `base`, producing the effective ECharts option.
 *
 * Merge rules:
 *  - Plain objects merge recursively.
 *  - Arrays merge **by index** during the merge (never element-by-element
 *    concatenation): an override on `series[0].itemStyle.color` must not wipe the
 *    `series[0].data` generated from the dataset. Base elements past the
 *    override's length are kept; extra override elements are appended.
 *  - The `DELETE` sentinel removes a thing: as an object value it removes that
 *    key; as an array element it removes that slot — after index-aligned
 *    merging, `DELETE` elements are filtered out, so a sentinel at the end
 *    truncates the array and one in the middle removes that element and shifts
 *    the rest down.
 *  - `null` is an *ordinary value* (e.g. `yAxis.min: null` = auto, `null` inside
 *    a `data` array = a gap): it merges and compares like any other value.
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
    if (ov === DELETE) {
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
  // Iterate by index so base[i] stays aligned with override[i]; DELETE elements
  // are simply not emitted, which compacts (and thus truncates) the result.
  for (let i = 0; i < length; i++) {
    const b = i < base.length ? base[i] : undefined;
    const o = i < override.length ? override[i] : undefined;
    if (i >= override.length) {
      result.push(b); // no override at this index → keep base element
    } else if (o === DELETE) {
      // element removed → emit nothing
    } else if (b === undefined) {
      result.push(clone(o));
    } else {
      result.push(mergeValue(b, o));
    }
  }
  return result;
}
