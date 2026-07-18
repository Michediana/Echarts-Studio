export type ColumnType = "string" | "number" | "date" | "boolean";

export interface DatasetColumn {
  id: string;
  name: string;
  type: ColumnType;
}

export interface DatasetRow {
  id: string;
  values: Record<string, string | number | boolean | null>;
}

export interface DatasetDocument {
  id: string;
  name: string;
  columns: DatasetColumn[];
  rows: DatasetRow[];
  createdAt: string;
  updatedAt: string;
}

export type SeriesType = "bar" | "line" | "scatter" | "pie" | "radar";
export type ChartCategory = "cartesian" | "pie" | "radar";

export interface SeriesBinding {
  id: string;
  columnId: string;
  name: string;
  color?: string;
}

export interface DatasetBinding {
  id: string;
  datasetId: string;
  chartType: SeriesType;
  xAxisColumnId: string | null;
  series: SeriesBinding[];
  pieNameColumnId: string | null;
  pieValueColumnId: string | null;
}

export interface TransformDocument {
  id: string;
  datasetId: string;
  type: string;
  config: Record<string, unknown>;
}

export interface ProjectMetadata {
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  schemaVersion: string;
}

export type Language = "en" | "it";

export interface UIState {
  sidebarWidth: number;
  inspectorWidth: number;
  bottomPanelHeight: number;
  selectedNodePath: string | null;
  lastActiveTab: string;
  bottomPanelOpen: boolean;
  bottomPanelTab: string;
  inspectorTab: string;
  mode: "basic" | "advanced";
  theme: "light" | "dark";
  language: Language;
  centerView: "chart" | "data";
}

export interface ProjectDocument {
  id: string;
  version: string;
  metadata: ProjectMetadata;
  datasets: DatasetDocument[];
  bindings: DatasetBinding[];
  transforms: TransformDocument[];
  chart: {
    option: Record<string, unknown>;
    theme?: string;
    renderer?: "canvas" | "svg";
  };
  uiState?: Partial<UIState>;
}

export interface ProjectFile {
  path: string;
  document: ProjectDocument;
}

function detectSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function detectSystemLanguage(): "en" | "it" {
  const langs = navigator.languages ?? [navigator.language];
  for (const lang of langs) {
    if (lang.startsWith("it")) return "it";
  }
  return "en";
}

export const DEFAULT_UI_STATE: UIState = {
  sidebarWidth: 260,
  inspectorWidth: 320,
  bottomPanelHeight: 250,
  selectedNodePath: null,
  lastActiveTab: "chart",
  bottomPanelOpen: false,
  bottomPanelTab: "json",
  inspectorTab: "properties",
  mode: "advanced",
  theme: detectSystemTheme(),
  language: detectSystemLanguage(),
  centerView: "chart",
};

export const SCHEMA_VERSION = "1.0.0";
