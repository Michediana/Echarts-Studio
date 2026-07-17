import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { v4 as uuid } from "uuid";
import Papa from "papaparse";
import { useProjectStore } from "@/stores/projectStore";
import type {
  DatasetDocument,
  DatasetColumn,
  DatasetRow,
  ColumnType,
  DatasetBinding,
  SeriesBinding,
} from "@/types/project";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Edit3,
  ArrowUpDown,
  Upload,
  Table,
  Database,
  Link2,
  Unlink,
  ChevronDown,
  ChevronRight,
  BarChart3,
} from "lucide-react";
import { useT } from "@/lib/i18n/context";

interface CellPosition {
  rowId: string;
  colId: string;
}

interface SortState {
  colId: string;
  dir: "asc" | "desc";
}

const COLUMN_TYPES: ColumnType[] = ["string", "number", "date", "boolean"];

function validateCellValue(
  value: string | number | boolean | null,
  type: ColumnType,
): boolean {
  if (value === null || value === "") return true;
  switch (type) {
    case "number":
      return !isNaN(Number(value));
    case "boolean":
      return value === "true" || value === "false" || typeof value === "boolean";
    case "date":
      return !isNaN(Date.parse(String(value)));
    case "string":
    default:
      return true;
  }
}

function coerceValue(value: string, type: ColumnType): string | number | boolean | null {
  if (value === "") return null;
  switch (type) {
    case "number": {
      const n = Number(value);
      return isNaN(n) ? value : n;
    }
    case "boolean":
      return value === "true";
    case "date":
    case "string":
    default:
      return value;
  }
}

export default function DataEditor() {
  const t = useT();
  const currentProject = useProjectStore((s) => s.currentProject);
  const updateDataset = useProjectStore((s) => s.updateDataset);
  const addDataset = useProjectStore((s) => s.addDataset);
  const removeDataset = useProjectStore((s) => s.removeDataset);
  const updateDatasetBinding = useProjectStore((s) => s.updateDatasetBinding);

  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editingHeader, setEditingHeader] = useState<string | null>(null);
  const [headerName, setHeaderName] = useState("");
  const [sortState, setSortState] = useState<SortState | null>(null);
  const [newColName, setNewColName] = useState("");
  const [bindingOpen, setBindingOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);

  const dataset = useMemo<DatasetDocument | null>(() => {
    if (!currentProject || !selectedDatasetId) return null;
    return (
      currentProject.datasets.find((d) => d.id === selectedDatasetId) ?? null
    );
  }, [currentProject, selectedDatasetId]);

  useEffect(() => {
    if (currentProject && currentProject.datasets.length > 0 && !selectedDatasetId) {
      setSelectedDatasetId(currentProject.datasets[0].id);
    }
    if (
      currentProject &&
      selectedDatasetId &&
      !currentProject.datasets.find((d) => d.id === selectedDatasetId)
    ) {
      setSelectedDatasetId(
        currentProject.datasets.length > 0 ? currentProject.datasets[0].id : null,
      );
    }
  }, [currentProject, selectedDatasetId]);

  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingCell]);

  useEffect(() => {
    if (editingHeader && headerInputRef.current) {
      headerInputRef.current.focus();
      headerInputRef.current.select();
    }
  }, [editingHeader]);

  const sortedRows = useMemo(() => {
    if (!dataset) return [];
    if (!sortState) return dataset.rows;

    return [...dataset.rows].sort((a, b) => {
      const aVal = a.values[sortState.colId];
      const bVal = b.values[sortState.colId];

      if (aVal === null && bVal === null) return 0;
      if (aVal === null) return 1;
      if (bVal === null) return -1;

      let cmp = 0;
      if (typeof aVal === "number" && typeof bVal === "number") {
        cmp = aVal - bVal;
      } else {
        cmp = String(aVal).localeCompare(String(bVal));
      }
      return sortState.dir === "asc" ? cmp : -cmp;
    });
  }, [dataset, sortState]);

  const validationErrors = useMemo(() => {
    if (!dataset) return new Map<string, boolean>();
    const errors = new Map<string, boolean>();
    for (const row of dataset.rows) {
      for (const col of dataset.columns) {
        const val = row.values[col.id];
        if (!validateCellValue(val, col.type)) {
          errors.set(`${row.id}:${col.id}`, true);
        }
      }
    }
    return errors;
  }, [dataset]);

  const persistDataset = useCallback(
    (updated: DatasetDocument) => {
      if (!currentProject) return;
      updateDataset(updated.id, updated);
    },
    [currentProject, updateDataset],
  );

  const currentBinding = useMemo<DatasetBinding | null>(() => {
    if (!currentProject || !dataset) return null;
    return currentProject.bindings?.find((b) => b.datasetId === dataset.id) ?? null;
  }, [currentProject, dataset]);

  const hasBinding = currentBinding !== null && (
    currentBinding.series.length > 0 ||
    currentBinding.pieNameColumnId || currentBinding.pieValueColumnId
  );

  const isPie = currentBinding?.chartType === "pie";
  const isRadar = currentBinding?.chartType === "radar";

  const toggleBinding = useCallback(() => {
    if (!dataset || !currentProject) return;
    if (currentBinding) {
      updateDatasetBinding(dataset.id, { ...currentBinding, series: [], pieNameColumnId: null, pieValueColumnId: null });
    } else {
      updateDatasetBinding(dataset.id, {
        id: uuid(),
        datasetId: dataset.id,
        chartType: "bar",
        xAxisColumnId: dataset.columns[0]?.id ?? null,
        series: [],
        pieNameColumnId: null,
        pieValueColumnId: null,
      });
    }
  }, [dataset, currentProject, currentBinding, updateDatasetBinding]);

  const setXAxisColumn = useCallback(
    (colId: string) => {
      if (!dataset || !currentBinding) return;
      updateDatasetBinding(dataset.id, { ...currentBinding, xAxisColumnId: colId || null });
    },
    [dataset, currentBinding, updateDatasetBinding],
  );

  const setPieColumn = useCallback(
    (field: "pieNameColumnId" | "pieValueColumnId", colId: string) => {
      if (!dataset || !currentBinding) return;
      updateDatasetBinding(dataset.id, { ...currentBinding, [field]: colId || null });
    },
    [dataset, currentBinding, updateDatasetBinding],
  );

  const addSeriesBinding = useCallback(() => {
    if (!dataset || !currentBinding) return;
    const numCol = dataset.columns.find((c) => c.type === "number");
    const newSeries: SeriesBinding = {
      id: uuid(),
      columnId: numCol?.id ?? dataset.columns[0]?.id ?? "",
      name: "",
    };
    updateDatasetBinding(dataset.id, {
      ...currentBinding,
      series: [...currentBinding.series, newSeries],
    });
  }, [dataset, currentBinding, updateDatasetBinding]);

  const updateSeriesBinding = useCallback(
    (seriesId: string, patch: Partial<SeriesBinding>) => {
      if (!dataset || !currentBinding) return;
      updateDatasetBinding(dataset.id, {
        ...currentBinding,
        series: currentBinding.series.map((s) =>
          s.id === seriesId ? { ...s, ...patch } : s,
        ),
      });
    },
    [dataset, currentBinding, updateDatasetBinding],
  );

  const removeSeriesBinding = useCallback(
    (seriesId: string) => {
      if (!dataset || !currentBinding) return;
      updateDatasetBinding(dataset.id, {
        ...currentBinding,
        series: currentBinding.series.filter((s) => s.id !== seriesId),
      });
    },
    [dataset, currentBinding, updateDatasetBinding],
  );

  const handleCellClick = useCallback(
    (rowId: string, colId: string) => {
      if (!dataset) return;
      const row = dataset.rows.find((r) => r.id === rowId);
      if (!row) return;
      const val = row.values[colId];
      setEditingCell({ rowId, colId });
      setEditValue(val === null ? "" : String(val));
    },
    [dataset],
  );

  const commitCellEdit = useCallback(() => {
    if (!dataset || !editingCell || !currentProject) return;
    const col = dataset.columns.find((c) => c.id === editingCell.colId);
    if (!col) return;

    const coerced = coerceValue(editValue, col.type);
    const updatedRows = dataset.rows.map((r) =>
      r.id === editingCell.rowId
        ? { ...r, values: { ...r.values, [editingCell.colId]: coerced } }
        : r,
    );

    persistDataset({ ...dataset, rows: updatedRows });
    setEditingCell(null);
    setEditValue("");
  }, [dataset, editingCell, editValue, currentProject, persistDataset]);

  const cancelCellEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue("");
  }, []);

  const handleHeaderDoubleClick = useCallback(
    (colId: string) => {
      if (!dataset) return;
      const col = dataset.columns.find((c) => c.id === colId);
      if (!col) return;
      setEditingHeader(colId);
      setHeaderName(col.name);
    },
    [dataset],
  );

  const commitHeaderEdit = useCallback(() => {
    if (!dataset || !editingHeader || !currentProject) return;
    const trimmed = headerName.trim();
    if (!trimmed) {
      setEditingHeader(null);
      return;
    }

    const updatedColumns = dataset.columns.map((c) =>
      c.id === editingHeader ? { ...c, name: trimmed } : c,
    );

    persistDataset({ ...dataset, columns: updatedColumns });
    setEditingHeader(null);
    setHeaderName("");
  }, [dataset, editingHeader, headerName, currentProject, persistDataset]);

  const cancelHeaderEdit = useCallback(() => {
    setEditingHeader(null);
    setHeaderName("");
  }, []);

  const handleAddRow = useCallback(() => {
    if (!dataset || !currentProject) return;
    const newRow: DatasetRow = {
      id: uuid(),
      values: Object.fromEntries(
        dataset.columns.map((c) => [c.id, c.type === "number" ? 0 : null]),
      ),
    };
    persistDataset({ ...dataset, rows: [...dataset.rows, newRow] });
  }, [dataset, currentProject, persistDataset]);

  const handleDeleteRow = useCallback(
    (rowId: string) => {
      if (!dataset) return;
      persistDataset({
        ...dataset,
        rows: dataset.rows.filter((r) => r.id !== rowId),
      });
    },
    [dataset, persistDataset],
  );

  const handleAddColumn = useCallback(() => {
    if (!dataset || !currentProject) return;
    const name = newColName.trim() || `Column ${dataset.columns.length + 1}`;
    const newCol: DatasetColumn = {
      id: uuid(),
      name,
      type: "string",
    };

    const updatedRows = dataset.rows.map((r) => ({
      ...r,
      values: { ...r.values, [newCol.id]: null },
    }));

    persistDataset({
      ...dataset,
      columns: [...dataset.columns, newCol],
      rows: updatedRows,
    });
    setNewColName("");
  }, [dataset, currentProject, newColName, persistDataset]);

  const handleDeleteColumn = useCallback(
    (colId: string) => {
      if (!dataset) return;
      const updatedColumns = dataset.columns.filter((c) => c.id !== colId);
      const updatedRows = dataset.rows.map((r) => {
        const newValues = { ...r.values };
        delete newValues[colId];
        return { ...r, values: newValues };
      });

      persistDataset({
        ...dataset,
        columns: updatedColumns,
        rows: updatedRows,
      });
    },
    [dataset, persistDataset],
  );

  const handleColumnTypeChange = useCallback(
    (colId: string, newType: ColumnType) => {
      if (!dataset) return;
      const updatedColumns = dataset.columns.map((c) =>
        c.id === colId ? { ...c, type: newType } : c,
      );
      persistDataset({ ...dataset, columns: updatedColumns });
    },
    [dataset, persistDataset],
  );

  const handleSort = useCallback(
    (colId: string) => {
      setSortState((prev) => {
        if (prev?.colId === colId) {
          if (prev.dir === "asc") return { colId, dir: "desc" };
          return null;
        }
        return { colId, dir: "asc" };
      });
    },
    [],
  );

  const handleCSVImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !currentProject) return;

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (!results.data || results.data.length === 0) {
            return;
          }

          const headers = results.meta.fields ?? [];

          const columns: DatasetColumn[] = headers.map((h) => ({
            id: uuid(),
            name: h,
            type: "string" as ColumnType,
          }));

          const rows: DatasetRow[] = (results.data as Record<string, string>[]).map((row) => ({
            id: uuid(),
            values: Object.fromEntries(
              columns.map((c, i) => {
                const raw = row[headers[i]] ?? "";
                const num = Number(raw);
                if (!isNaN(num) && raw !== "") return [c.id, num];
                return [c.id, raw || null];
              }),
            ),
          }));

          const newDataset: DatasetDocument = {
            id: uuid(),
            name: file.name.replace(/\.csv$/i, ""),
            columns,
            rows,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          addDataset(newDataset);
          setSelectedDatasetId(newDataset.id);
          toast.success(t("dataEditor.importedRows", { count: rows.length, file: file.name }));
        },
        error: (err) => {
          console.error("CSV parse error:", err);
          toast.error(t("dataEditor.failedParseCsv"));
        },
      });

      e.target.value = "";
    },
    [currentProject, addDataset, t],
  );

  const handleDeleteDataset = useCallback(() => {
    if (!dataset || !currentProject) return;
    removeDataset(currentProject.id);
    setSelectedDatasetId(null);
  }, [dataset, currentProject, removeDataset]);

  if (!currentProject) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <Database className="h-10 w-10 opacity-40" />
        <p className="text-sm">{t("dataEditor.noProjectLoaded")}</p>
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <Table className="h-10 w-10 opacity-40" />
        <p className="text-sm">{t("dataEditor.selectOrCreateDataset")}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleCSVImport}
      />

      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Select
          value={selectedDatasetId ?? ""}
          onValueChange={setSelectedDatasetId}
        >
          <SelectTrigger className="h-7 w-48 text-xs">
            <SelectValue placeholder={t("dataEditor.selectDatasetPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {currentProject.datasets.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mr-1 h-3.5 w-3.5" />
          {t("dataEditor.importCsv")}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={handleAddRow}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          {t("dataEditor.addRow")}
        </Button>

        <div className="flex items-center gap-1">
          <Input
            className="h-7 w-28 text-xs"
            placeholder={t("dataEditor.columnNamePlaceholder")}
            value={newColName}
            onChange={(e) => setNewColName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddColumn();
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handleAddColumn}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            {t("dataEditor.addCol")}
          </Button>
        </div>

        <div className="flex-1" />

        {dataset.rows.some((_, i) =>
          dataset.columns.some((c) =>
            validationErrors.get(`${dataset.rows[i].id}:${c.id}`),
          ),
        ) && (
          <Badge variant="destructive" className="text-xs">
            {t("dataEditor.invalidCells")}
          </Badge>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-destructive hover:text-destructive"
          onClick={handleDeleteDataset}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Binding panel */}
      <div className="border-b bg-muted/20">
        <button
          className="flex w-full items-center gap-2 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/40 transition-colors"
          onClick={() => setBindingOpen((o) => !o)}
        >
          {hasBinding ? (
            <Link2 className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Unlink className="h-3.5 w-3.5" />
          )}
          {bindingOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          <BarChart3 className="h-3.5 w-3.5" />
          {t("dataEditor.bindingTitle")}
          {hasBinding && (
            <Badge variant="secondary" className="ml-auto text-[10px]">
              {currentBinding!.chartType}
            </Badge>
          )}
        </button>

        {bindingOpen && dataset && (
          <div className="space-y-2 border-t px-3 py-2">
            {!currentBinding ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={toggleBinding}
                >
                  <Link2 className="mr-1 h-3 w-3" />
                  {t("dataEditor.bindingEnable")}
                </Button>
                <span className="text-[11px] text-muted-foreground">
                  {t("dataEditor.bindingHint")}
                </span>
              </div>
            ) : (
              <>
                {/* Unlink button */}
                <div className="flex justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] text-destructive hover:text-destructive"
                    onClick={toggleBinding}
                  >
                    <Unlink className="mr-1 h-3 w-3" />
                    {t("dataEditor.bindingDisable")}
                  </Button>
                </div>

                {isPie ? (
                  <>
                    {/* Pie: name + value columns */}
                    <div className="flex items-center gap-2">
                      <span className="w-16 text-[11px] font-medium text-muted-foreground">
                        {t("dataEditor.bindingPieName")}:
                      </span>
                      <Select
                        value={currentBinding.pieNameColumnId ?? ""}
                        onValueChange={(v) => setPieColumn("pieNameColumnId", v)}
                      >
                        <SelectTrigger className="h-7 w-44 text-xs">
                          <SelectValue placeholder={t("dataEditor.bindingSelectColumn")} />
                        </SelectTrigger>
                        <SelectContent>
                          {dataset.columns.map((c) => (
                            <SelectItem key={c.id} value={c.id} className="text-xs">
                              {c.name} <span className="text-muted-foreground">({c.type})</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-16 text-[11px] font-medium text-muted-foreground">
                        {t("dataEditor.bindingPieValue")}:
                      </span>
                      <Select
                        value={currentBinding.pieValueColumnId ?? ""}
                        onValueChange={(v) => setPieColumn("pieValueColumnId", v)}
                      >
                        <SelectTrigger className="h-7 w-44 text-xs">
                          <SelectValue placeholder={t("dataEditor.bindingSelectColumn")} />
                        </SelectTrigger>
                        <SelectContent>
                          {dataset.columns.map((c) => (
                            <SelectItem key={c.id} value={c.id} className="text-xs">
                              {c.name} <span className="text-muted-foreground">({c.type})</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Cartesian / Radar: xAxis selector */}
                    {!isRadar && (
                      <div className="flex items-center gap-2">
                        <span className="w-16 text-[11px] font-medium text-muted-foreground">
                          xAxis:
                        </span>
                        <Select
                          value={currentBinding.xAxisColumnId ?? ""}
                          onValueChange={setXAxisColumn}
                        >
                          <SelectTrigger className="h-7 w-44 text-xs">
                            <SelectValue placeholder={t("dataEditor.bindingSelectColumn")} />
                          </SelectTrigger>
                          <SelectContent>
                            {dataset.columns.map((c) => (
                              <SelectItem key={c.id} value={c.id} className="text-xs">
                                {c.name} <span className="text-muted-foreground">({c.type})</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Series / Indicators list */}
                    <div className="space-y-1.5">
                      {currentBinding.series.map((sb) => (
                        <div key={sb.id} className="flex items-center gap-2">
                          <span className="w-16 text-[11px] font-medium text-muted-foreground">
                            {isRadar ? "Indicator:" : "Series:"}
                          </span>
                          <Select
                            value={sb.columnId}
                            onValueChange={(v) => updateSeriesBinding(sb.id, { columnId: v })}
                          >
                            <SelectTrigger className="h-7 w-44 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {dataset.columns.map((c) => (
                                <SelectItem key={c.id} value={c.id} className="text-xs">
                                  {c.name} <span className="text-muted-foreground">({c.type})</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Input
                            className="h-7 w-28 text-xs"
                            placeholder={t("dataEditor.bindingNamePlaceholder")}
                            value={sb.name}
                            onChange={(e) => updateSeriesBinding(sb.id, { name: e.target.value })}
                          />

                          <button
                            className="rounded p-0.5 text-destructive/70 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => removeSeriesBinding(sb.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={addSeriesBinding}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      {isRadar ? t("dataEditor.bindingAddIndicator") : t("dataEditor.bindingAddSeries")}
                    </Button>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <table className="w-full border-collapse text-sm">
            <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur">
              <tr>
                <th className="w-10 border border-border px-1 py-1.5 text-center text-xs font-medium text-muted-foreground">
                  #
                </th>
                {dataset.columns.map((col) => (
                  <th
                    key={col.id}
                    className="min-w-[100px] border border-border px-2 py-1.5 text-left"
                  >
                    <div className="flex items-center gap-1.5">
                      {editingHeader === col.id ? (
                        <Input
                          ref={headerInputRef}
                          className="h-6 text-xs"
                          value={headerName}
                          onChange={(e) => setHeaderName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") commitHeaderEdit();
                            if (e.key === "Escape") cancelHeaderEdit();
                          }}
                          onBlur={commitHeaderEdit}
                        />
                      ) : (
                        <span
                          className="cursor-pointer select-none truncate font-medium"
                          onDoubleClick={() => handleHeaderDoubleClick(col.id)}
                        >
                          {col.name}
                        </span>
                      )}

                      <Badge variant="secondary" className="shrink-0 text-[10px]">
                        {col.type}
                      </Badge>

                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          className="rounded p-0.5 hover:bg-accent"
                          onClick={() => handleSort(col.id)}
                          title={t("dataEditor.sortTooltip")}
                        >
                          <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                        </button>

                        <Select
                          value={col.type}
                          onValueChange={(val) =>
                            handleColumnTypeChange(col.id, val as ColumnType)
                          }
                        >
                          <SelectTrigger className="h-5 w-5 border-0 bg-transparent p-0 hover:bg-accent [&>svg]:hidden">
                            <Edit3 className="h-3 w-3 text-muted-foreground" />
                          </SelectTrigger>
                          <SelectContent>
                            {COLUMN_TYPES.map((t) => (
                              <SelectItem key={t} value={t} className="text-xs">
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <button
                          className="rounded p-0.5 text-destructive/70 hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => handleDeleteColumn(col.id)}
                          title={t("dataEditor.deleteColumnTooltip")}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    {sortState?.colId === col.id && (
                      <span className="mt-0.5 text-[10px] text-muted-foreground">
                        {sortState.dir === "asc" ? t("dataEditor.sortedAsc") : t("dataEditor.sortedDesc")}
                      </span>
                    )}
                  </th>
                ))}
                <th className="w-8 border border-border px-1 py-1.5" />
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row, rowIdx) => (
                <tr key={row.id} className="group hover:bg-muted/30">
                  <td className="border border-border px-1 py-1 text-center text-xs text-muted-foreground">
                    {rowIdx + 1}
                  </td>
                  {dataset.columns.map((col) => {
                    const cellKey = `${row.id}:${col.id}`;
                    const hasError = validationErrors.get(cellKey) ?? false;
                    const isEditing =
                      editingCell?.rowId === row.id &&
                      editingCell?.colId === col.id;
                    const val = row.values[col.id];

                    return (
                      <td
                        key={col.id}
                        className={`border border-border px-2 py-1 ${
                          hasError ? "bg-destructive/10" : ""
                        } ${isEditing ? "bg-accent" : "cursor-pointer"}`}
                        onClick={() => {
                          if (!isEditing) handleCellClick(row.id, col.id);
                        }}
                      >
                        {isEditing ? (
                          <Input
                            ref={editInputRef}
                            className="h-6 w-full text-xs"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitCellEdit();
                              if (e.key === "Escape") cancelCellEdit();
                            }}
                            onBlur={commitCellEdit}
                          />
                        ) : (
                          <span
                            className={`block truncate text-xs ${
                              hasError ? "text-destructive" : ""
                            }`}
                            title={val === null ? "null" : String(val)}
                          >
                            {val === null ? (
                              <span className="italic text-muted-foreground/50">
                                null
                              </span>
                            ) : (
                              String(val)
                            )}
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className="border border-border px-1 py-1 text-center">
                    <button
                      className="rounded p-0.5 text-destructive/0 opacity-0 transition-opacity group-hover:text-destructive/70 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDeleteRow(row.id)}
                      title={t("dataEditor.deleteRowTooltip")}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {dataset.rows.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
              <Table className="h-8 w-8 opacity-40" />
              <p className="text-xs">{t("dataEditor.noRowsHint")}</p>
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="flex items-center justify-between border-t px-3 py-1 text-xs text-muted-foreground">
        <span>
          {t("dataEditor.rowsColumnsFooter", { rows: dataset.rows.length, cols: dataset.columns.length })}
        </span>
        <span>{dataset.name}</span>
      </div>
    </div>
  );
}
