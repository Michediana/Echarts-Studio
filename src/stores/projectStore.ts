import { create } from "zustand";
import { v4 as uuid } from "uuid";
import { invoke } from "@tauri-apps/api/core";
import type {
  ProjectDocument,
  DatasetDocument,
  DatasetColumn,
  DatasetRow,
} from "@/types/project";

const SAMPLE_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const REVENUE = [12000, 15000, 13500, 17000, 16200, 19500, 21000, 20500, 22000, 24000, 23500, 26000];
const COST = [8000, 9500, 8800, 10200, 9800, 11500, 12500, 12000, 13200, 14000, 13800, 15000];

function createSampleDataset(): DatasetDocument {
  const columns: DatasetColumn[] = [
    { id: uuid(), name: "month", type: "string" },
    { id: uuid(), name: "revenue", type: "number" },
    { id: uuid(), name: "cost", type: "number" },
  ];

  const rows: DatasetRow[] = SAMPLE_MONTHS.map((month, i) => ({
    id: uuid(),
    values: {
      [columns[0].id]: month,
      [columns[1].id]: REVENUE[i],
      [columns[2].id]: COST[i],
    },
  }));

  const now = new Date().toISOString();

  return {
    id: uuid(),
    name: "Monthly Sales",
    columns,
    rows,
    createdAt: now,
    updatedAt: now,
  };
}

function createDefaultChartOption(dataset: DatasetDocument): Record<string, unknown> {
  const monthCol = dataset.columns.find((c) => c.name === "month");
  const revenueCol = dataset.columns.find((c) => c.name === "revenue");
  const costCol = dataset.columns.find((c) => c.name === "cost");

  if (!monthCol || !revenueCol || !costCol) {
    return {};
  }

  const categories = dataset.rows.map((r) => String(r.values[monthCol.id] ?? ""));
  const revenueData = dataset.rows.map((r) => Number(r.values[revenueCol.id] ?? 0));
  const costData = dataset.rows.map((r) => Number(r.values[costCol.id] ?? 0));

  return {
    title: {
      text: "Monthly Sales Overview",
      subtitle: "Revenue vs Cost",
      left: "center",
    },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
    },
    legend: {
      data: ["Revenue", "Cost"],
      bottom: 0,
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "12%",
      top: "18%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: categories,
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        name: "Revenue",
        type: "bar",
        data: revenueData,
        itemStyle: { color: "#5470c6" },
      },
      {
        name: "Cost",
        type: "bar",
        data: costData,
        itemStyle: { color: "#91cc75" },
      },
    ],
  };
}

function createDefaultProject(): ProjectDocument {
  const now = new Date().toISOString();
  const dataset = createSampleDataset();

  return {
    id: uuid(),
    version: "1.0.0",
    metadata: {
      name: "Untitled Project",
      description: "A new ECharts project",
      createdAt: now,
      updatedAt: now,
      tags: [],
      schemaVersion: "1.0.0",
    },
    datasets: [dataset],
    transforms: [],
    chart: {
      option: createDefaultChartOption(dataset),
      theme: undefined,
      renderer: "canvas",
    },
  };
}

interface ProjectStore {
  currentProject: ProjectDocument | null;
  currentFilePath: string | null;
  isDirty: boolean;
  recentProjects: string[];

  createProject: () => void;
  openProject: (path: string) => Promise<void>;
  saveProject: () => Promise<void>;
  saveProjectAs: (path: string) => Promise<void>;
  updateChartOption: (option: Record<string, unknown>) => void;
  updateMetadata: (metadata: Partial<ProjectDocument["metadata"]>) => void;
  addDataset: (dataset: DatasetDocument) => void;
  removeDataset: (datasetId: string) => void;
  updateDataset: (datasetId: string, dataset: Partial<DatasetDocument>) => void;
  setProject: (project: ProjectDocument, filePath?: string | null) => void;
  markDirty: () => void;
  markClean: () => void;
  loadRecentProjects: () => Promise<void>;
  addRecentProject: (path: string) => Promise<void>;
  removeRecentProject: (path: string) => Promise<void>;
}

const RECENT_PROJECTS_KEY = "echarts-studio:recent-projects";

function loadRecentFromStorage(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_PROJECTS_KEY);
    if (raw) return JSON.parse(raw) as string[];
  } catch {}
  return [];
}

function saveRecentToStorage(paths: string[]): void {
  localStorage.setItem(RECENT_PROJECTS_KEY, JSON.stringify(paths));
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  currentProject: null,
  currentFilePath: null,
  isDirty: false,
  recentProjects: loadRecentFromStorage(),

  createProject: () => {
    const project = createDefaultProject();
    set({
      currentProject: project,
      currentFilePath: null,
      isDirty: false,
    });
  },

  openProject: async (path: string) => {
    try {
      const content = await invoke<string>("read_project", { path });
      const doc = JSON.parse(content) as ProjectDocument;
      set({
        currentProject: doc,
        currentFilePath: path,
        isDirty: false,
      });
      await get().addRecentProject(path);
    } catch (err) {
      console.error("Failed to open project:", err);
      throw err;
    }
  },

  saveProject: async () => {
    const { currentProject, currentFilePath } = get();
    if (!currentProject) return;

    const now = new Date().toISOString();
    currentProject.metadata.updatedAt = now;

    if (currentFilePath) {
      try {
        const content = JSON.stringify(currentProject, null, 2);
        await invoke("write_project", {
          path: currentFilePath,
          content,
        });
        set({ isDirty: false });
      } catch (err) {
        console.error("Failed to save project:", err);
        throw err;
      }
    } else {
      const { save } = await import("@tauri-apps/plugin-dialog");
      const savedPath = await save({
        filters: [{ name: "ECharts Project", extensions: ["echarts.json", "json"] }],
        defaultPath: `${currentProject.metadata.name || "project"}.echarts.json`,
      });
      if (!savedPath) return;
      const content = JSON.stringify(currentProject, null, 2);
      await invoke("write_project", {
        path: savedPath,
        content,
      });
      set({
        currentFilePath: savedPath,
        isDirty: false,
      });
      await get().addRecentProject(savedPath);
    }
  },

  saveProjectAs: async (path: string) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const now = new Date().toISOString();
    currentProject.metadata.updatedAt = now;

    try {
      const content = JSON.stringify(currentProject, null, 2);
      await invoke("write_project", {
        path,
        content,
      });
      set({
        currentFilePath: path,
        isDirty: false,
      });
      await get().addRecentProject(path);
    } catch (err) {
      console.error("Failed to save project as:", err);
      throw err;
    }
  },

  updateChartOption: (option: Record<string, unknown>) => {
    const { currentProject } = get();
    if (!currentProject) return;

    set({
      currentProject: {
        ...currentProject,
        chart: {
          ...currentProject.chart,
          option,
        },
      },
      isDirty: true,
    });
  },

  updateMetadata: (metadata) => {
    const { currentProject } = get();
    if (!currentProject) return;

    set({
      currentProject: {
        ...currentProject,
        metadata: {
          ...currentProject.metadata,
          ...metadata,
          updatedAt: new Date().toISOString(),
        },
      },
      isDirty: true,
    });
  },

  addDataset: (dataset: DatasetDocument) => {
    const { currentProject } = get();
    if (!currentProject) return;

    set({
      currentProject: {
        ...currentProject,
        datasets: [...currentProject.datasets, dataset],
        metadata: {
          ...currentProject.metadata,
          updatedAt: new Date().toISOString(),
        },
      },
      isDirty: true,
    });
  },

  removeDataset: (datasetId: string) => {
    const { currentProject } = get();
    if (!currentProject) return;

    set({
      currentProject: {
        ...currentProject,
        datasets: currentProject.datasets.filter((d) => d.id !== datasetId),
        metadata: {
          ...currentProject.metadata,
          updatedAt: new Date().toISOString(),
        },
      },
      isDirty: true,
    });
  },

  updateDataset: (datasetId: string, partial: Partial<DatasetDocument>) => {
    const { currentProject } = get();
    if (!currentProject) return;

    set({
      currentProject: {
        ...currentProject,
        datasets: currentProject.datasets.map((d) =>
          d.id === datasetId ? { ...d, ...partial, updatedAt: new Date().toISOString() } : d,
        ),
        metadata: {
          ...currentProject.metadata,
          updatedAt: new Date().toISOString(),
        },
      },
      isDirty: true,
    });
  },

  setProject: (project: ProjectDocument, filePath: string | null = null) => {
    set({
      currentProject: project,
      currentFilePath: filePath,
      isDirty: false,
    });
  },

  markDirty: () => set({ isDirty: true }),
  markClean: () => set({ isDirty: false }),

  loadRecentProjects: async () => {
    set({ recentProjects: loadRecentFromStorage() });
  },

  addRecentProject: async (path: string) => {
    const { recentProjects } = get();
    const updated = [path, ...recentProjects.filter((p) => p !== path)].slice(0, 20);
    saveRecentToStorage(updated);
    set({ recentProjects: updated });
  },

  removeRecentProject: async (path: string) => {
    const { recentProjects } = get();
    const updated = recentProjects.filter((p) => p !== path);
    saveRecentToStorage(updated);
    set({ recentProjects: updated });
  },
}));
