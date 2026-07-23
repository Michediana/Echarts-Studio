import { v4 as uuid } from "uuid";
import type { DatasetDocument, DatasetBinding, SeriesType } from "@/types/project";

const SERIES_COLORS = [
  "#5470c6", "#91cc75", "#fac858", "#ee6666", "#73c0de",
  "#3ba272", "#fc8452", "#9a60b4", "#ea7ccc",
];

/**
 * Build a sensible, immediately-renderable binding for a dataset: the first
 * text/date column becomes the category axis (or pie name), and every numeric
 * column becomes a series (or the pie value / radar indicators). Used when the
 * user picks a source dataset from the chart status bar, so switching data never
 * produces an empty chart that then needs manual wiring.
 */
export function buildAutoBinding(
  dataset: DatasetDocument,
  chartType: SeriesType = "bar",
): DatasetBinding {
  const categoryCol =
    dataset.columns.find((c) => c.type === "string" || c.type === "date") ??
    dataset.columns[0] ??
    null;
  const numberCols = dataset.columns.filter((c) => c.type === "number");
  const seriesCols = numberCols.length > 0 ? numberCols : dataset.columns.filter((c) => c !== categoryCol);

  const base: DatasetBinding = {
    id: uuid(),
    datasetId: dataset.id,
    chartType,
    xAxisColumnId: categoryCol?.id ?? null,
    series: [],
    pieNameColumnId: null,
    pieValueColumnId: null,
  };

  if (chartType === "pie") {
    return {
      ...base,
      pieNameColumnId: categoryCol?.id ?? null,
      pieValueColumnId: numberCols[0]?.id ?? null,
    };
  }

  return {
    ...base,
    series: seriesCols.map((col, i) => ({
      id: uuid(),
      columnId: col.id,
      name: col.name,
      color: SERIES_COLORS[i % SERIES_COLORS.length],
    })),
  };
}
