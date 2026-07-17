import type {
  DatasetDocument,
  DatasetBinding,
} from "@/types/project";

const SERIES_COLORS = [
  "#5470c6", "#91cc75", "#fac858", "#ee6666", "#73c0de",
  "#3ba272", "#fc8452", "#9a60b4", "#ea7ccc",
];

export function datasetToOption(
  dataset: DatasetDocument,
  binding: DatasetBinding,
): Record<string, unknown> {
  switch (binding.chartType) {
    case "pie":
      return buildPieOption(dataset, binding);
    case "radar":
      return buildRadarOption(dataset, binding);
    default:
      return buildCartesianOption(dataset, binding);
  }
}

function buildCartesianOption(
  dataset: DatasetDocument,
  binding: DatasetBinding,
): Record<string, unknown> {
  const xAxisCol = binding.xAxisColumnId
    ? dataset.columns.find((c) => c.id === binding.xAxisColumnId)
    : null;

  const categories = xAxisCol
    ? dataset.rows.map((r) => String(r.values[xAxisCol.id] ?? ""))
    : dataset.rows.map((_, i) => String(i + 1));

  const series = binding.series.map((sb, idx) => {
    const col = dataset.columns.find((c) => c.id === sb.columnId);
    const data = col
      ? dataset.rows.map((r) => {
          const v = r.values[col.id];
          return v === null || v === undefined ? 0 : Number(v) || 0;
        })
      : [];

    return {
      name: sb.name || col?.name || `Series ${idx + 1}`,
      type: binding.chartType,
      data,
      itemStyle: { color: sb.color ?? SERIES_COLORS[idx % SERIES_COLORS.length] },
    };
  });

  const legendData = series.map((s) => s.name);

  return {
    tooltip: { trigger: "axis", axisPointer: { type: binding.chartType === "bar" ? "shadow" : "cross" } },
    legend: legendData.length > 0 ? { data: legendData, bottom: 0 } : undefined,
    grid: {
      left: "3%",
      right: "4%",
      bottom: legendData.length > 0 ? "12%" : "3%",
      top: "10%",
      containLabel: true,
    },
    xAxis: { type: "category", data: categories },
    yAxis: { type: "value" },
    series,
  };
}

function buildPieOption(
  dataset: DatasetDocument,
  binding: DatasetBinding,
): Record<string, unknown> {
  const nameCol = binding.pieNameColumnId
    ? dataset.columns.find((c) => c.id === binding.pieNameColumnId)
    : null;
  const valueCol = binding.pieValueColumnId
    ? dataset.columns.find((c) => c.id === binding.pieValueColumnId)
    : null;

  const data = dataset.rows.map((r, i) => ({
    name: nameCol ? String(r.values[nameCol.id] ?? "") : String(i + 1),
    value: valueCol ? Number(r.values[valueCol.id] ?? 0) : 0,
    itemStyle: { color: SERIES_COLORS[i % SERIES_COLORS.length] },
  }));

  return {
    tooltip: { trigger: "item", formatter: "{b}: {c} ({d}%)" },
    legend: { orient: "vertical", left: "left", bottom: 0 },
    series: [
      {
        name: nameCol?.name ?? "Data",
        type: "pie",
        radius: ["40%", "70%"],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 6, borderColor: "transparent", borderWidth: 2 },
        label: { show: true, formatter: "{b}\n{d}%" },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: "bold" } },
        data,
      },
    ],
  };
}

function buildRadarOption(
  dataset: DatasetDocument,
  binding: DatasetBinding,
): Record<string, unknown> {
  const indicatorCols = binding.series.map((sb) =>
    dataset.columns.find((c) => c.id === sb.columnId),
  ).filter(Boolean);

  const maxValues = indicatorCols.map((col) => {
    const vals = dataset.rows.map((r) => Number(r.values[col!.id] ?? 0));
    return Math.max(...vals, 1);
  });

  const indicator = indicatorCols.map((col, i) => ({
    name: col!.name,
    max: maxValues[i] * 1.2,
  }));

  const radarData = dataset.rows.map((r, rowIdx) => ({
    value: indicatorCols.map((col) => Number(r.values[col!.id] ?? 0)),
    name: String(r.values[dataset.columns[0]?.id] ?? `Row ${rowIdx + 1}`),
  }));

  return {
    tooltip: {},
    legend: { data: radarData.map((d) => d.name), bottom: 0 },
    radar: { indicator },
    series: [
      {
        type: "radar",
        data: radarData,
      },
    ],
  };
}
