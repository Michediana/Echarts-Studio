/**
 * Path helpers for reading/writing nested option values addressed by a
 * dotted/bracketed path such as `series[0].itemStyle.color`.
 *
 * These are shared by the inspector, the override store actions and the tests,
 * so that "how a path maps to a location" is defined in exactly one place.
 */

function parsePath(path: string): string[] {
  return path.replace(/\[(\d+)]/g, ".$1").split(".").filter((p) => p.length > 0);
}

export function getNested(obj: unknown, path: string): unknown {
  const parts = parsePath(path);
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/**
 * Immutably set (or, when `value === undefined`, delete) the value at `path`.
 * Returns a new object; the input is never mutated. Intermediate containers are
 * created as arrays or objects depending on whether the next path segment is a
 * numeric index.
 */
export function setNested(
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  const parts = parsePath(path);
  if (parts.length === 0) return obj;

  const clone = (v: unknown, wantArray: boolean): Record<string, unknown> | unknown[] => {
    if (Array.isArray(v)) return [...v];
    if (v != null && typeof v === "object") return { ...(v as Record<string, unknown>) };
    return wantArray ? [] : {};
  };

  const result = clone(obj, false) as Record<string, unknown>;
  let current: Record<string, unknown> | unknown[] = result;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const nextIsIndex = /^\d+$/.test(parts[i + 1]);
    const existing = (current as Record<string, unknown>)[part];
    const next = clone(existing, nextIsIndex);
    (current as Record<string, unknown>)[part] = next;
    current = next;
  }

  const last = parts[parts.length - 1];
  if (value === undefined) {
    if (Array.isArray(current)) {
      current.splice(Number(last), 1);
    } else {
      delete (current as Record<string, unknown>)[last];
    }
  } else {
    (current as Record<string, unknown>)[last] = value;
  }

  return result;
}
