import type { ProjectDocument, DatasetBinding } from "@/types/project";
import { isPlainObject } from "@/lib/chart/deepEqual";
import { DELETE } from "@/lib/chart/deepMerge";

/**
 * Pure, testable migration of a saved project up to the current schema (2.1.0).
 *
 * 1.0.0 → 2.0.0: 1.0.0 stored two disconnected sources of truth — a
 * project-level `bindings[]` array and a `chart.option` object. 2.0.0 unifies
 * them: the first binding becomes `chart.binding` (the generator) and
 * `chart.option` becomes `chart.overrides` (manual edits merged on the base).
 *
 * 2.0.0 → 2.1.0: in 2.0.0, `null` inside `chart.overrides` meant "delete this
 * property". 2.1.0 makes `null` an ordinary value (needed for `min: null`, gaps
 * in `data`, …) and uses an explicit {@link DELETE} sentinel for removals. This
 * step rewrites every `null` inside `chart.overrides` to `DELETE` so old files
 * keep their meaning. Datasets are left untouched — their nulls are real data.
 *
 * The function is idempotent: a document already at 2.1.0 is returned normalised
 * but unchanged in meaning.
 */
export function migrateProject(raw: unknown): ProjectDocument {
  if (!isPlainObject(raw)) {
    throw new Error("Invalid project document: expected an object");
  }

  const doc = { ...raw } as Record<string, unknown>;
  const metadata = isPlainObject(doc.metadata) ? { ...doc.metadata } : {};
  const schemaVersion =
    typeof metadata.schemaVersion === "string" ? metadata.schemaVersion : "1.0.0";

  const chart = isPlainObject(doc.chart) ? { ...doc.chart } : {};
  const isLegacy = schemaVersion === "1.0.0" || "option" in chart || "bindings" in doc;

  // Step 1 — normalise to the 2.x chart shape (binding + overrides).
  const renderer = chart.renderer === "svg" ? "svg" : "canvas";
  const theme = typeof chart.theme === "string" ? chart.theme : undefined;

  let binding: DatasetBinding | undefined;
  let overrides: Record<string, unknown>;

  if (isLegacy) {
    const legacyBindings = Array.isArray(doc.bindings)
      ? (doc.bindings as DatasetBinding[])
      : [];
    binding = legacyBindings[0];
    overrides = isPlainObject(chart.option) ? (chart.option as Record<string, unknown>) : {};
  } else {
    binding = chart.binding as DatasetBinding | undefined;
    overrides = isPlainObject(chart.overrides) ? (chart.overrides as Record<string, unknown>) : {};
  }

  // Step 2 — 2.0.0 → 2.1.0: convert legacy null-as-delete into the DELETE
  // sentinel. Only for documents older than 2.1.0, so a 2.1.0 file's legitimate
  // null values are preserved.
  if (schemaVersion !== "2.1.0") {
    overrides = convertNullsToDelete(overrides) as Record<string, unknown>;
  }

  delete doc.bindings;

  const migratedChart: Record<string, unknown> = { overrides, renderer };
  if (binding) migratedChart.binding = binding;
  if (theme !== undefined) migratedChart.theme = theme;

  return {
    ...doc,
    metadata: { ...metadata, schemaVersion: "2.1.0" },
    transforms: Array.isArray(doc.transforms) ? doc.transforms : [],
    chart: migratedChart,
  } as unknown as ProjectDocument;
}

/** Recursively replace every `null` with the `DELETE` sentinel. */
function convertNullsToDelete(value: unknown): unknown {
  if (value === null) return DELETE;
  if (Array.isArray(value)) return value.map(convertNullsToDelete);
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      out[key] = convertNullsToDelete(value[key]);
    }
    return out;
  }
  return value;
}
