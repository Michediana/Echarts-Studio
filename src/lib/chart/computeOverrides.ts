import { deepEqual, isPlainObject, clone } from "./deepEqual";
import { deepMerge } from "./deepMerge";

/**
 * Given the generated `base` option and an `edited` option (e.g. from the raw
 * JSON editor), compute the minimal set of overrides such that
 * `deepMerge(base, overrides)` reproduces `edited`.
 *
 * The diff mirrors {@link deepMerge}'s semantics so it round-trips:
 *  - object keys present only in `base` are marked removed with `null`;
 *  - arrays are diffed by index; an unchanged object element becomes `{}` (an
 *    empty, no-op override) so that dataset-generated data — e.g. `series[i].data`
 *    — is *not* copied into the overrides and stays linked to the dataset.
 *
 * Returns `null` when the diff cannot be represented reliably (verified by
 * re-merging and comparing). Callers should then fall back to storing the whole
 * edited object as overrides, warning the user that the dataset link is broken.
 */
export function computeOverrides(
  base: Record<string, unknown>,
  edited: Record<string, unknown>,
): Record<string, unknown> | null {
  const candidate = diffValue(base, edited) as Record<string, unknown>;
  const remerged = deepMerge(base, candidate);
  return deepEqual(remerged, edited) ? candidate : null;
}

function diffValue(base: unknown, edited: unknown): unknown {
  if (isPlainObject(base) && isPlainObject(edited)) return diffObject(base, edited);
  if (Array.isArray(base) && Array.isArray(edited)) return diffArray(base, edited);
  return clone(edited);
}

function diffObject(
  base: Record<string, unknown>,
  edited: Record<string, unknown>,
): Record<string, unknown> {
  const frag: Record<string, unknown> = {};
  for (const key of Object.keys(edited)) {
    if (!(key in base)) {
      frag[key] = clone(edited[key]);
    } else if (!deepEqual(base[key], edited[key])) {
      frag[key] = diffValue(base[key], edited[key]);
    }
  }
  for (const key of Object.keys(base)) {
    if (!(key in edited)) frag[key] = null; // removed → null tells merge to delete
  }
  return frag;
}

function diffArray(base: unknown[], edited: unknown[]): unknown[] {
  const length = Math.max(base.length, edited.length);
  const arr: unknown[] = [];
  for (let i = 0; i < length; i++) {
    if (i >= edited.length) {
      arr[i] = null; // element removed
    } else if (i >= base.length) {
      arr[i] = clone(edited[i]);
    } else if (deepEqual(base[i], edited[i])) {
      // Unchanged: an empty object override is a no-op that keeps the base
      // element (and its dataset-derived data) intact; primitives are echoed.
      arr[i] = isPlainObject(base[i]) ? {} : clone(base[i]);
    } else {
      arr[i] = diffValue(base[i], edited[i]);
    }
  }
  return arr;
}
