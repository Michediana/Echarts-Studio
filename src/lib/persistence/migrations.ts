import type { ProjectDocument, DatasetBinding } from "@/types/project";
import { isPlainObject } from "@/lib/chart/deepEqual";

/**
 * Pure, testable migration from the legacy 1.0.0 project schema to 2.0.0.
 *
 * 1.0.0 stored two disconnected sources of truth: a project-level `bindings[]`
 * array and a `chart.option` object. 2.0.0 unifies them: the first binding
 * becomes `chart.binding` (the generator) and `chart.option` becomes
 * `chart.overrides` (manual edits merged on top of the generated base).
 *
 * The function is idempotent: a document already at 2.0.0 is returned normalised
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

  if (schemaVersion === "1.0.0" || "option" in chart || "bindings" in doc) {
    const legacyBindings = Array.isArray(doc.bindings)
      ? (doc.bindings as DatasetBinding[])
      : [];
    const binding = legacyBindings[0];

    const overrides = isPlainObject(chart.option)
      ? (chart.option as Record<string, unknown>)
      : {};

    const migratedChart: Record<string, unknown> = {
      overrides,
      renderer: chart.renderer === "svg" ? "svg" : "canvas",
    };
    if (binding) migratedChart.binding = binding;
    if (typeof chart.theme === "string") migratedChart.theme = chart.theme;

    delete doc.bindings;

    return {
      ...doc,
      metadata: { ...metadata, schemaVersion: "2.0.0" },
      transforms: Array.isArray(doc.transforms) ? doc.transforms : [],
      chart: migratedChart,
    } as unknown as ProjectDocument;
  }

  // Already 2.0.0 — normalise required fields defensively.
  return {
    ...doc,
    metadata: { ...metadata, schemaVersion: "2.0.0" },
    transforms: Array.isArray(doc.transforms) ? doc.transforms : [],
    chart: {
      binding: chart.binding as DatasetBinding | undefined,
      overrides: isPlainObject(chart.overrides)
        ? (chart.overrides as Record<string, unknown>)
        : {},
      theme: typeof chart.theme === "string" ? chart.theme : undefined,
      renderer: chart.renderer === "svg" ? "svg" : "canvas",
    },
  } as unknown as ProjectDocument;
}
