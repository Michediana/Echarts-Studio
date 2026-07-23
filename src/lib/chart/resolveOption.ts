import type { EChartsOption } from "echarts";
import type { ProjectDocument } from "@/types/project";
import { datasetToOption } from "@/lib/data/datasetToOption";
import { deepMerge } from "./deepMerge";

/**
 * The base option generated purely from the dataset binding, before any manual
 * overrides are applied. Empty when there is no binding or the referenced
 * dataset is missing.
 */
export function resolveBaseOption(project: ProjectDocument): Record<string, unknown> {
  const binding = project.chart.binding;
  if (!binding) return {};
  const dataset = project.datasets.find((d) => d.id === binding.datasetId);
  if (!dataset) return {};
  return datasetToOption(dataset, binding);
}

/**
 * The single source of truth for the effective ECharts option: the base option
 * generated from the binding, deep-merged with the user's manual overrides.
 * The option is a *derived* value — it is never stored in the project.
 */
export function resolveOption(project: ProjectDocument): EChartsOption {
  const base = resolveBaseOption(project);
  const overrides = project.chart.overrides ?? {};
  return deepMerge(base, overrides) as EChartsOption;
}
