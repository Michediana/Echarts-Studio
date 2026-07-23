import { create } from "zustand";
import { v4 as uuid } from "uuid";
import { invoke } from "@tauri-apps/api/core";
import {
  produceWithPatches,
  applyPatches,
  enablePatches,
  setAutoFreeze,
  type Patch,
} from "immer";
import type {
  ProjectDocument,
  DatasetDocument,
  DatasetColumn,
  DatasetRow,
  DatasetBinding,
} from "@/types/project";
import { resolveBaseOption } from "@/lib/chart/resolveOption";
import { getNested, setNested } from "@/lib/chart/path";
import { deepEqual } from "@/lib/chart/deepEqual";
import { pruneStructuralOverrides } from "@/lib/chart/overrideStatus";
import { buildAutoBinding } from "@/lib/data/autoBinding";
import { migrateProject } from "@/lib/persistence/migrations";

/*
 * History strategy — immer `produceWithPatches` (chosen over `zundo`).
 *
 * The old implementation deep-cloned the *entire* project — datasets and all
 * rows included — on every action, keeping 50 such snapshots. A single cell
 * keystroke on a 50k-row CSV meant cloning tens of MB per stroke.
 *
 * With immer patches, each action records only the minimal forward/inverse
 * patch describing what actually changed. Editing a chart override touches only
 * `chart.overrides`, so datasets never enter the option history at all — which
 * is the explicit requirement. `zundo` would also work, but it snapshots the
 * whole tracked slice; getting per-field granularity and coalescing out of it
 * is more indirect than owning the patch pipeline here. `updateDataset` below
 * reconciles incoming rows field-by-field so that even data edits produce tiny,
 * cell-level patches rather than whole-dataset replacements.
 */
enablePatches();
// Auto-freeze is disabled: much of the app (e.g. DataEditor) constructs derived
// objects by spreading store state, and freezing every nested node adds cost
// and risk of accidental "cannot mutate frozen object" crashes for no benefit
// here — the store only ever produces new state through immer.
setAutoFreeze(false);

const MAX_HISTORY = 50;
const COALESCE_MS = 500;

interface HistoryEntry {
  patches: Patch[];
  inversePatches: Patch[];
  groupId?: string;
  time: number;
}

const SAMPLE_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
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

function createDefaultProject(): ProjectDocument {
  const now = new Date().toISOString();
  const dataset = createSampleDataset();

  const monthCol = dataset.columns.find((c) => c.name === "month");
  const revenueCol = dataset.columns.find((c) => c.name === "revenue");
  const costCol = dataset.columns.find((c) => c.name === "cost");

  const binding: DatasetBinding = {
    id: uuid(),
    datasetId: dataset.id,
    chartType: "bar",
    xAxisColumnId: monthCol?.id ?? null,
    series: [
      ...(revenueCol
        ? [{ id: uuid(), columnId: revenueCol.id, name: "Revenue", color: "#5470c6" }]
        : []),
      ...(costCol
        ? [{ id: uuid(), columnId: costCol.id, name: "Cost", color: "#91cc75" }]
        : []),
    ],
    pieNameColumnId: null,
    pieValueColumnId: null,
  };

  return {
    id: uuid(),
    version: "2.1.0",
    metadata: {
      name: "Untitled Project",
      description: "A new ECharts project",
      createdAt: now,
      updatedAt: now,
      tags: [],
      schemaVersion: "2.1.0",
      isDefault: true,
    },
    datasets: [dataset],
    transforms: [],
    chart: {
      binding,
      // A small title override demonstrates the base-plus-overrides model:
      // the bars come from the binding, the title is a manual override.
      overrides: { title: { text: "Monthly Sales Overview", left: "center" } },
      theme: undefined,
      renderer: "canvas",
    },
  };
}

function pushEntry(stack: HistoryEntry[], entry: HistoryEntry): HistoryEntry[] {
  const last = stack[stack.length - 1];
  if (
    entry.groupId &&
    last &&
    last.groupId === entry.groupId &&
    entry.time - last.time < COALESCE_MS
  ) {
    // Coalesce a continuous edit (same field, in quick succession) into one
    // undo step: forward patches concatenate, inverse patches prepend.
    const merged: HistoryEntry = {
      patches: [...last.patches, ...entry.patches],
      inversePatches: [...entry.inversePatches, ...last.inversePatches],
      groupId: entry.groupId,
      time: entry.time,
    };
    return [...stack.slice(0, -1), merged];
  }
  const next = [...stack, entry];
  if (next.length > MAX_HISTORY) next.shift();
  return next;
}

interface MutateOptions {
  history?: boolean;
  groupId?: string;
  markEdited?: boolean;
}

interface ProjectStore {
  currentProject: ProjectDocument | null;
  currentFilePath: string | null;
  isDirty: boolean;
  recentProjects: string[];

  undoStack: HistoryEntry[];
  redoStack: HistoryEntry[];
  canUndo: boolean;
  canRedo: boolean;

  createProject: () => void;
  openProject: (path: string) => Promise<void>;
  saveProject: () => Promise<void>;
  saveProjectAs: (path: string) => Promise<void>;

  setOptionOverride: (path: string, value: unknown) => void;
  setOptionOverrides: (overrides: Record<string, unknown>, groupId?: string) => void;
  resetOptionOverride: (path: string) => void;
  clearOverrides: () => void;
  applyTemplate: (option: Record<string, unknown>) => void;

  updateMetadata: (metadata: Partial<ProjectDocument["metadata"]>) => void;
  addDataset: (dataset: DatasetDocument) => void;
  removeDataset: (datasetId: string) => void;
  updateDataset: (datasetId: string, dataset: Partial<DatasetDocument>) => void;
  updateDatasetBinding: (datasetId: string, binding: DatasetBinding) => void;
  setSourceDataset: (datasetId: string) => void;
  clearBinding: () => void;
  setChartType: (chartType: DatasetBinding["chartType"]) => void;
  setProject: (project: ProjectDocument, filePath?: string | null) => void;
  markDirty: () => void;
  markClean: () => void;
  loadRecentProjects: () => Promise<void>;
  addRecentProject: (path: string) => Promise<void>;
  removeRecentProject: (path: string) => Promise<void>;

  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => {
  /**
   * Apply an immutable mutation to the current project via immer, recording a
   * patch-based history entry unless `history` is disabled.
   */
  const mutate = (recipe: (draft: ProjectDocument) => void, opts: MutateOptions = {}) => {
    const { history = true, groupId, markEdited = true } = opts;
    const cp = get().currentProject;
    if (!cp) return;

    const [next, patches, inversePatches] = produceWithPatches(cp, (draft) => {
      recipe(draft);
      if (markEdited) {
        draft.metadata.isDefault = false;
        draft.metadata.updatedAt = new Date().toISOString();
      }
    });

    if (patches.length === 0) return;

    if (!history) {
      set({ currentProject: next, isDirty: true });
      return;
    }

    const undoStack = pushEntry(get().undoStack, {
      patches,
      inversePatches,
      groupId,
      time: Date.now(),
    });

    set({
      currentProject: next,
      isDirty: true,
      undoStack,
      redoStack: [],
      canUndo: undoStack.length > 0,
      canRedo: false,
    });
  };

  return {
    currentProject: null,
    currentFilePath: null,
    isDirty: false,
    recentProjects: [],

    undoStack: [],
    redoStack: [],
    canUndo: false,
    canRedo: false,

    createProject: () => {
      set({
        currentProject: createDefaultProject(),
        currentFilePath: null,
        isDirty: false,
      });
      get().clearHistory();
    },

    openProject: async (path: string) => {
      try {
        const content = await invoke<string>("read_project", { path });
        const doc = migrateProject(JSON.parse(content));
        set({
          currentProject: doc,
          currentFilePath: path,
          isDirty: false,
        });
        get().clearHistory();
        await get().addRecentProject(path);
      } catch (err) {
        console.error("Failed to open project:", err);
        throw err;
      }
    },

    saveProject: async () => {
      const { currentProject, currentFilePath } = get();
      if (!currentProject) return;

      // Build a new object rather than mutating currentProject in place.
      const stamped: ProjectDocument = {
        ...currentProject,
        metadata: { ...currentProject.metadata, updatedAt: new Date().toISOString() },
      };

      if (currentFilePath) {
        const content = JSON.stringify(stamped, null, 2);
        await invoke("write_project", { path: currentFilePath, content });
        set({ currentProject: stamped, isDirty: false });
      } else {
        const { save } = await import("@tauri-apps/plugin-dialog");
        const savedPath = await save({
          filters: [{ name: "ECharts Project", extensions: ["echarts.json", "json"] }],
          defaultPath: `${stamped.metadata.name || "project"}.echarts.json`,
        });
        if (!savedPath) return;
        const content = JSON.stringify(stamped, null, 2);
        await invoke("write_project", { path: savedPath, content });
        set({ currentProject: stamped, currentFilePath: savedPath, isDirty: false });
        await get().addRecentProject(savedPath);
      }
    },

    saveProjectAs: async (path: string) => {
      const { currentProject } = get();
      if (!currentProject) return;

      const stamped: ProjectDocument = {
        ...currentProject,
        metadata: { ...currentProject.metadata, updatedAt: new Date().toISOString() },
      };
      const content = JSON.stringify(stamped, null, 2);
      await invoke("write_project", { path, content });
      set({ currentProject: stamped, currentFilePath: path, isDirty: false });
      await get().addRecentProject(path);
    },

    setOptionOverride: (path: string, value: unknown) => {
      const cp = get().currentProject;
      if (!cp) return;
      const base = resolveBaseOption(cp);
      const baseValue = getNested(base, path);
      // Only persist an override when the value actually differs from the value
      // the base generates; matching the base clears the override (reset-to-default).
      const newOverrides = deepEqual(value, baseValue)
        ? setNested(cp.chart.overrides, path, undefined)
        : setNested(cp.chart.overrides, path, value);
      if (deepEqual(newOverrides, cp.chart.overrides)) return;
      mutate((draft) => {
        draft.chart.overrides = newOverrides;
      }, { groupId: `override:${path}` });
    },

    setOptionOverrides: (overrides: Record<string, unknown>, groupId?: string) => {
      const cp = get().currentProject;
      if (!cp) return;
      if (deepEqual(overrides, cp.chart.overrides)) return;
      mutate((draft) => {
        draft.chart.overrides = overrides;
      }, { groupId });
    },

    resetOptionOverride: (path: string) => {
      const cp = get().currentProject;
      if (!cp) return;
      const newOverrides = setNested(cp.chart.overrides, path, undefined);
      if (deepEqual(newOverrides, cp.chart.overrides)) return;
      mutate((draft) => {
        draft.chart.overrides = newOverrides;
      });
    },

    clearOverrides: () => {
      const cp = get().currentProject;
      if (!cp || Object.keys(cp.chart.overrides).length === 0) return;
      mutate((draft) => {
        draft.chart.overrides = {};
      });
    },

    applyTemplate: (option: Record<string, unknown>) => {
      // Applying a template is the one place where detaching from the dataset is
      // the intended behaviour: overrides become the template and the binding is
      // cleared explicitly.
      mutate((draft) => {
        draft.chart.overrides = option;
        draft.chart.binding = undefined;
      });
    },

    updateMetadata: (metadata) => {
      mutate((draft) => {
        Object.assign(draft.metadata, metadata);
      });
    },

    addDataset: (dataset: DatasetDocument) => {
      mutate((draft) => {
        draft.datasets.push(dataset);
      });
    },

    removeDataset: (datasetId: string) => {
      mutate((draft) => {
        draft.datasets = draft.datasets.filter((d) => d.id !== datasetId);
        if (draft.chart.binding?.datasetId === datasetId) {
          draft.chart.binding = undefined;
        }
      });
    },

    updateDataset: (datasetId: string, partial: Partial<DatasetDocument>) => {
      mutate((draft) => {
        const d = draft.datasets.find((ds) => ds.id === datasetId);
        if (!d) return;
        if (partial.name !== undefined) d.name = partial.name;
        if (partial.columns !== undefined) d.columns = partial.columns;
        d.updatedAt = new Date().toISOString();

        if (partial.rows !== undefined) {
          const newRows = partial.rows;
          // Reconcile row-by-row so a single cell change yields a single small
          // patch instead of replacing the whole (potentially huge) rows array.
          if (d.rows.length !== newRows.length) d.rows.length = newRows.length;
          for (let i = 0; i < newRows.length; i++) {
            const nr = newRows[i];
            const cur = d.rows[i];
            if (!cur || cur.id !== nr.id) {
              d.rows[i] = nr;
              continue;
            }
            for (const key of Object.keys(nr.values)) {
              if (cur.values[key] !== nr.values[key]) cur.values[key] = nr.values[key];
            }
            for (const key of Object.keys(cur.values)) {
              if (!(key in nr.values)) delete cur.values[key];
            }
          }
        }
      }, { groupId: `dataset:${datasetId}` });
    },

    updateDatasetBinding: (_datasetId: string, binding: DatasetBinding) => {
      const prev = get().currentProject?.chart.binding;
      // A change of source dataset or chart type rebuilds the generated base
      // entirely, so any structural override (series/axes) left from the old
      // shape would index-merge onto the new base and intertwine. Prune those,
      // keeping cosmetic overrides. Field tweaks (xAxis, series list, names)
      // are not structural and preserve overrides as before.
      const structuralChange =
        !prev ||
        prev.datasetId !== binding.datasetId ||
        prev.chartType !== binding.chartType;
      mutate((draft) => {
        draft.chart.binding = binding;
        if (structuralChange) {
          draft.chart.overrides = pruneStructuralOverrides(draft.chart.overrides);
        }
      }, { groupId: "binding" });
    },

    setSourceDataset: (datasetId: string) => {
      const cp = get().currentProject;
      if (!cp) return;
      const dataset = cp.datasets.find((d) => d.id === datasetId);
      if (!dataset) return;
      if (cp.chart.binding?.datasetId === datasetId) return;
      // Preserve the current chart type where possible; build a fresh, working
      // binding for the newly chosen dataset and drop structural overrides.
      const chartType = cp.chart.binding?.chartType ?? "bar";
      mutate((draft) => {
        draft.chart.binding = buildAutoBinding(dataset, chartType);
        draft.chart.overrides = pruneStructuralOverrides(draft.chart.overrides);
      });
    },

    clearBinding: () => {
      mutate((draft) => {
        draft.chart.binding = undefined;
      });
    },

    setChartType: (chartType) => {
      mutate((draft) => {
        if (draft.chart.binding) {
          if (draft.chart.binding.chartType !== chartType) {
            // The base for series/axes is rebuilt for the new type; drop stale
            // structural overrides so they don't intertwine with it.
            draft.chart.overrides = pruneStructuralOverrides(draft.chart.overrides);
          }
          draft.chart.binding = { ...draft.chart.binding, chartType };
          return;
        }
        const dataset = draft.datasets[0];
        if (!dataset) return;
        draft.chart.binding = buildAutoBinding(dataset, chartType);
        draft.chart.overrides = pruneStructuralOverrides(draft.chart.overrides);
      });
    },

    setProject: (project: ProjectDocument, filePath: string | null = null) => {
      set({ currentProject: project, currentFilePath: filePath, isDirty: false });
      get().clearHistory();
    },

    markDirty: () => set({ isDirty: true }),
    markClean: () => set({ isDirty: false }),

    undo: () => {
      const { currentProject, undoStack, redoStack } = get();
      if (!currentProject) return;
      const entry = undoStack[undoStack.length - 1];
      if (!entry) return;
      const next = applyPatches(currentProject, entry.inversePatches) as ProjectDocument;
      const newUndo = undoStack.slice(0, -1);
      const newRedo = [...redoStack, entry];
      set({
        currentProject: next,
        isDirty: true,
        undoStack: newUndo,
        redoStack: newRedo,
        canUndo: newUndo.length > 0,
        canRedo: true,
      });
    },

    redo: () => {
      const { currentProject, undoStack, redoStack } = get();
      if (!currentProject) return;
      const entry = redoStack[redoStack.length - 1];
      if (!entry) return;
      const next = applyPatches(currentProject, entry.patches) as ProjectDocument;
      const newRedo = redoStack.slice(0, -1);
      const newUndo = [...undoStack, entry];
      set({
        currentProject: next,
        isDirty: true,
        undoStack: newUndo,
        redoStack: newRedo,
        canUndo: true,
        canRedo: newRedo.length > 0,
      });
    },

    clearHistory: () => {
      set({ undoStack: [], redoStack: [], canUndo: false, canRedo: false });
    },

    loadRecentProjects: async () => {
      try {
        const list = await invoke<string[]>("list_recent_projects");
        set({ recentProjects: list });
      } catch (err) {
        console.error("Failed to load recent projects:", err);
      }
    },

    addRecentProject: async (path: string) => {
      try {
        await invoke("add_recent_project", { path });
        const list = await invoke<string[]>("list_recent_projects");
        set({ recentProjects: list });
      } catch (err) {
        console.error("Failed to add recent project:", err);
      }
    },

    removeRecentProject: async (path: string) => {
      const updated = get().recentProjects.filter((p) => p !== path);
      try {
        await invoke("save_recent_projects", { projects: updated });
        set({ recentProjects: updated });
      } catch (err) {
        console.error("Failed to remove recent project:", err);
      }
    },
  };
});
