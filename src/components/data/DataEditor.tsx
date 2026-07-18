import {
  useState,
  useCallback,
  useRef,
  useMemo,
  useEffect,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
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
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
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
  Copy,
  Scissors,
  ClipboardPaste,
} from "lucide-react";
import { useT } from "@/lib/i18n/context";

interface CellPosition {
  rowId: string;
  colId: string;
}

interface CellRange {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
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

  // Spreadsheet: selection state
  const [activeCell, setActiveCell] = useState<CellPosition | null>(null);
  const [selectionRange, setSelectionRange] = useState<CellRange | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [clipboard, setClipboard] = useState<{
    data: (string | number | boolean | null)[][];
    mode: "copy" | "cut";
  } | null>(null);
  const [dragOverCell, setDragOverCell] = useState<CellPosition | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isTableGrabbing, setIsTableGrabbing] = useState(false);
  const [hoveredCellBorder, setHoveredCellBorder] = useState<boolean>(false);
  const [hoveredFillHandle, setHoveredFillHandle] = useState<boolean>(false);
  const [contextMenuCell, setContextMenuCell] = useState<CellPosition | null>(null);
  const dragStartRef = useRef<{ row: number; col: number; x: number; y: number; onBorder: boolean } | null>(null);
  const isFillDraggingRef = useRef(false);
  const fillSourceRef = useRef<CellRange | null>(null);

  const BORDER_THRESHOLD = 5;
  const FILL_HANDLE_SIZE = 7;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  const dataset = useMemo<DatasetDocument | null>(() => {
    if (!currentProject || !selectedDatasetId) return null;
    return (
      currentProject.datasets.find((d) => d.id === selectedDatasetId) ?? null
    );
  }, [currentProject, selectedDatasetId]);

  // Grid data: columns/rows with indices, and lookup maps
  const { gridCols, gridRows, colIndexMap, rowIndexMap } = useMemo(() => {
    if (!dataset) return { gridCols: [], gridRows: [], colIndexMap: new Map(), rowIndexMap: new Map() };
    const cols = dataset.columns.map((c, i) => ({ ...c, idx: i }));
    const rows = dataset.rows.map((r, i) => ({ ...r, idx: i }));
    return {
      gridCols: cols,
      gridRows: rows,
      colIndexMap: new Map(dataset.columns.map((c, i) => [c.id, i])),
      rowIndexMap: new Map(dataset.rows.map((r, i) => [r.id, i])),
    };
  }, [dataset]);

  // Active cell position in grid coordinates
  const activeCellPos = useMemo(() => {
    if (!activeCell || !dataset) return null;
    const ri = rowIndexMap.get(activeCell.rowId);
    const ci = colIndexMap.get(activeCell.colId);
    if (ri === undefined || ci === undefined) return null;
    return { row: ri, col: ci };
  }, [activeCell, dataset, rowIndexMap, colIndexMap]);

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

  // Clear selection when switching datasets
  useEffect(() => {
    setActiveCell(null);
    setSelectionRange(null);
    setEditingCell(null);
    setClipboard(null);
  }, [selectedDatasetId]);

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

  // ── Spreadsheet: Navigation helpers ──────────────────────────

  const clamp = (v: number, min: number, max: number) =>
    Math.max(min, Math.min(max, v));

  const clampRange = useCallback(
    (r: CellRange): CellRange => ({
      startRow: clamp(r.startRow, 0, gridRows.length - 1),
      startCol: clamp(r.startCol, 0, gridCols.length - 1),
      endRow: clamp(r.endRow, 0, gridRows.length - 1),
      endCol: clamp(r.endCol, 0, gridCols.length - 1),
    }),
    [gridRows.length, gridCols.length],
  );

  const positionToCell = useCallback(
    (row: number, col: number): CellPosition => ({
      rowId: gridRows[row]?.id ?? "",
      colId: gridCols[col]?.id ?? "",
    }),
    [gridRows, gridCols],
  );

  const selectCell = useCallback(
    (row: number, col: number) => {
      const pos = positionToCell(row, col);
      setActiveCell(pos);
      setSelectionRange({
        startRow: row,
        startCol: col,
        endRow: row,
        endCol: col,
      });
    },
    [positionToCell],
  );

  const extendSelection = useCallback(
    (row: number, col: number) => {
      if (!activeCellPos) return;
      setSelectionRange({
        startRow: activeCellPos.row,
        startCol: activeCellPos.col,
        endRow: row,
        endCol: col,
      });
    },
    [activeCellPos],
  );

  const moveActiveCell = useCallback(
    (dRow: number, dCol: number, keepExtending?: boolean) => {
      if (!activeCellPos) {
        if (gridRows.length > 0 && gridCols.length > 0) {
          selectCell(0, 0);
        }
        return;
      }
      const newRow = clamp(activeCellPos.row + dRow, 0, gridRows.length - 1);
      const newCol = clamp(activeCellPos.col + dCol, 0, gridCols.length - 1);
      if (keepExtending) {
        extendSelection(newRow, newCol);
        setActiveCell(positionToCell(newRow, newCol));
      } else {
        selectCell(newRow, newCol);
      }
    },
    [activeCellPos, gridRows.length, gridCols.length, selectCell, extendSelection, positionToCell],
  );

  // ── Spreadsheet: Cell editing ────────────────────────────────

  const startEditing = useCallback(
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

  const commitEdit = useCallback(() => {
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

  const cancelEdit = useCallback(() => {
    setEditingCell(null);
    setEditValue("");
  }, []);

  const commitEditAndMove = useCallback(
    (dRow: number, dCol: number) => {
      commitEdit();
      // Defer move so editingCell state is cleared first
      requestAnimationFrame(() => {
        moveActiveCell(dRow, dCol);
        tableRef.current?.focus();
      });
    },
    [commitEdit, moveActiveCell],
  );

  // ── Spreadsheet: Clipboard ───────────────────────────────────

  const getSelectedCellsData = useCallback((): (string | number | boolean | null)[][] => {
    if (!dataset || !selectionRange) return [];
    const range = clampRange(selectionRange);
    const r1 = Math.min(range.startRow, range.endRow);
    const r2 = Math.max(range.startRow, range.endRow);
    const c1 = Math.min(range.startCol, range.endCol);
    const c2 = Math.max(range.startCol, range.endCol);
    const result: (string | number | boolean | null)[][] = [];
    for (let r = r1; r <= r2; r++) {
      const row = dataset.rows[gridRows[r]?.idx ?? r];
      if (!row) continue;
      const rowData: (string | number | boolean | null)[] = [];
      for (let c = c1; c <= c2; c++) {
        const col = dataset.columns[gridCols[c]?.idx ?? c];
        rowData.push(col ? (row.values[col.id] ?? null) : null);
      }
      result.push(rowData);
    }
    return result;
  }, [dataset, selectionRange, clampRange, gridRows, gridCols]);

  const handleCopy = useCallback(() => {
    const data = getSelectedCellsData();
    if (data.length === 0) return;
    const tsv = data.map((row) => row.map((v) => (v === null ? "" : String(v))).join("\t")).join("\n");
    navigator.clipboard.writeText(tsv).catch(() => {});
    setClipboard({ data, mode: "copy" });
  }, [getSelectedCellsData]);

  const handleCut = useCallback(() => {
    handleCopy();
    setClipboard((prev) => (prev ? { ...prev, mode: "cut" } : null));
  }, [handleCopy]);

  const handleDeleteSelected = useCallback(() => {
    if (!dataset || !selectionRange) return;
    const range = clampRange(selectionRange);
    const r1 = Math.min(range.startRow, range.endRow);
    const r2 = Math.max(range.startRow, range.endRow);
    const c1 = Math.min(range.startCol, range.endCol);
    const c2 = Math.max(range.startCol, range.endCol);

    const updatedRows = dataset.rows.map((row, ri) => {
      if (ri < r1 || ri > r2) return row;
      const newValues = { ...row.values };
      for (let ci = c1; ci <= c2; ci++) {
        const col = dataset.columns[ci];
        if (col) newValues[col.id] = null;
      }
      return { ...row, values: newValues };
    });

    persistDataset({ ...dataset, rows: updatedRows });
  }, [dataset, selectionRange, clampRange, persistDataset]);

  const handlePaste = useCallback(async () => {
    if (!dataset || !activeCell) return;

    let text: string;
    try {
      text = await navigator.clipboard.readText();
    } catch {
      return;
    }
    if (!text) return;

    const parsed = text.split("\n").filter((line) => line.length > 0 || text.includes("\n")).map((line) =>
      line.split("\t").map((cell) => cell.replace(/\r$/, "")),
    );
    if (parsed.length === 0) return;

    const rows = parsed;
    const startRow = rowIndexMap.get(activeCell.rowId);
    const startCol = colIndexMap.get(activeCell.colId);
    if (startRow === undefined || startCol === undefined) return;

    const updatedRows = [...dataset.rows];
    for (let dr = 0; dr < rows.length; dr++) {
      const targetRowIdx = startRow + dr;
      if (targetRowIdx >= updatedRows.length) {
        const newRow: DatasetRow = {
          id: uuid(),
          values: Object.fromEntries(
            dataset.columns.map((c) => [c.id, c.type === "number" ? 0 : null]),
          ),
        };
        updatedRows.push(newRow);
      }
      const row = { ...updatedRows[targetRowIdx] };
      row.values = { ...row.values };
      for (let dc = 0; dc < rows[dr].length; dc++) {
        const targetColIdx = startCol + dc;
        if (targetColIdx >= dataset.columns.length) break;
        const col = dataset.columns[targetColIdx];
        const raw = rows[dr][dc];
        row.values[col.id] = raw === "" ? null : coerceValue(raw, col.type);
      }
      updatedRows[targetRowIdx] = row;
    }

    persistDataset({ ...dataset, rows: updatedRows });

    if (clipboard?.mode === "cut") {
      setClipboard(null);
    }

    const endRow = Math.min(startRow + rows.length - 1, dataset.rows.length - 1);
    const endCol = Math.min(startCol + (rows[0]?.length ?? 1) - 1, dataset.columns.length - 1);
    selectCell(endRow, endCol);
  }, [dataset, activeCell, rowIndexMap, colIndexMap, clipboard, persistDataset, selectCell]);

  // ── Spreadsheet: Mouse handlers ──────────────────────────────

  const isInRange = useCallback(
    (row: number, col: number, range: CellRange): boolean => {
      const r1 = Math.min(range.startRow, range.endRow);
      const r2 = Math.max(range.startRow, range.endRow);
      const c1 = Math.min(range.startCol, range.endCol);
      const c2 = Math.max(range.startCol, range.endCol);
      return row >= r1 && row <= r2 && col >= c1 && col <= c2;
    },
    [],
  );

  const isOnCellBorder = useCallback(
    (e: React.MouseEvent): boolean => {
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      const { clientX: x, clientY: y } = e;
      const t = BORDER_THRESHOLD;
      return (
        x - rect.left < t ||
        rect.right - x < t ||
        y - rect.top < t ||
        rect.bottom - y < t
      );
    },
    [],
  );

  const isOnFillHandle = useCallback(
    (e: React.MouseEvent): boolean => {
      const target = e.currentTarget as HTMLElement;
      const rect = target.getBoundingClientRect();
      const { clientX: x, clientY: y } = e;
      return (
        rect.right - x <= FILL_HANDLE_SIZE &&
        rect.bottom - y <= FILL_HANDLE_SIZE
      );
    },
    [],
  );

  const handleCellMouseDown = useCallback(
    (row: number, col: number, e: React.MouseEvent) => {
      if (e.button !== 0) return;
      document.body.style.userSelect = "none";
      if (editingCell) {
        commitEdit();
      }

      const onFill = isOnFillHandle(e);
      const isSelected = selectionRange ? isInRange(row, col, selectionRange) : false;

      if (onFill && isSelected && selectionRange) {
        // Fill handle → start fill drag
        fillSourceRef.current = { ...clampRange(selectionRange) };
        isFillDraggingRef.current = true;
        setIsSelecting(false);
        setIsTableGrabbing(true);
        document.body.style.cursor = "crosshair";
        document.body.style.userSelect = "none";
        dragStartRef.current = null;
        return;
      }

      const onBorder = isOnCellBorder(e);

      if (onBorder && isSelected) {
        // Border of selected cell → prepare for cell drag
      } else if (e.shiftKey && activeCellPos) {
        extendSelection(row, col);
      } else {
        selectCell(row, col);
        setIsSelecting(true);
      }

      dragStartRef.current = { row, col, x: e.clientX, y: e.clientY, onBorder };
    },
    [editingCell, commitEdit, activeCellPos, selectCell, extendSelection, selectionRange, isInRange, isOnCellBorder, isOnFillHandle, clampRange],
  );

  const handleCellMouseMove = useCallback(
    (row: number, col: number, e: React.MouseEvent) => {
      // Fill handle hover detection (only on selected cells)
      const onFill = isOnFillHandle(e);
      const isSelected = selectionRange ? isInRange(row, col, selectionRange) : false;
      setHoveredFillHandle(onFill && isSelected && !editingCell);

      // Fill drag in progress → track target
      if (isFillDraggingRef.current) {
        document.body.style.cursor = "crosshair";
        setDragOverCell(positionToCell(row, col));
        return;
      }

      // Border hover detection
      const onBorder = isOnCellBorder(e);
      setHoveredCellBorder(onBorder && !onFill);

      // Selection drag (mousedown + move on interior of any cell)
      if (isSelecting && activeCellPos && dragStartRef.current && !dragStartRef.current.onBorder) {
        setSelectionRange({
          startRow: activeCellPos.row,
          startCol: activeCellPos.col,
          endRow: row,
          endCol: col,
        });
      }

      // Cell drag detection (only if started on border of a selected cell)
      if (dragStartRef.current?.onBorder && !isDragging) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
          setIsDragging(true);
          setIsTableGrabbing(true);
          setIsSelecting(false);
          document.body.style.cursor = "grabbing";
          document.body.style.userSelect = "none";
        }
      }

      // While cell-dragging, track hover target
      if (isDragging) {
        setDragOverCell(positionToCell(row, col));
      }
    },
    [isSelecting, isDragging, activeCellPos, positionToCell, isOnCellBorder, isOnFillHandle, selectionRange, isInRange, editingCell],
  );

  const handleMouseUp = useCallback(() => {
    setIsSelecting(false);
    setIsDragging(false);
    setIsTableGrabbing(false);
    setDragOverCell(null);
    setHoveredCellBorder(false);
    setHoveredFillHandle(false);
    dragStartRef.current = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  const handleCellDrop = useCallback(
    (targetRow: number, targetCol: number, e: React.MouseEvent) => {
      e.preventDefault();

      // ── Fill drop ──
      if (isFillDraggingRef.current && dataset && fillSourceRef.current) {
        const sourceRange = clampRange(fillSourceRef.current);
        const sr1 = Math.min(sourceRange.startRow, sourceRange.endRow);
        const sr2 = Math.max(sourceRange.startRow, sourceRange.endRow);
        const sc1 = Math.min(sourceRange.startCol, sourceRange.endCol);
        const sc2 = Math.max(sourceRange.startCol, sourceRange.endCol);
        const srcRows = sr2 - sr1 + 1;
        const srcCols = sc2 - sc1 + 1;

        let fillStartRow: number;
        let fillEndRow: number;
        let fillStartCol: number;
        let fillEndCol: number;

        if (targetRow > sr2) {
          fillStartRow = sr2 + 1;
          fillEndRow = targetRow;
        } else if (targetRow < sr1) {
          fillStartRow = targetRow;
          fillEndRow = sr1 - 1;
        } else {
          fillStartRow = sr1;
          fillEndRow = sr2;
        }

        if (targetCol > sc2) {
          fillStartCol = sc2 + 1;
          fillEndCol = targetCol;
        } else if (targetCol < sc1) {
          fillStartCol = targetCol;
          fillEndCol = sc1 - 1;
        } else {
          fillStartCol = sc1;
          fillEndCol = sc2;
        }

        let updatedRows = [...dataset.rows];

        // Add new rows if needed
        while (updatedRows.length <= Math.max(fillEndRow, fillStartRow)) {
          updatedRows.push({
            id: uuid(),
            values: Object.fromEntries(
              dataset.columns.map((c) => [c.id, c.type === "number" ? 0 : null]),
            ),
          });
        }

        updatedRows = updatedRows.map((row, ri) => {
          if (ri < fillStartRow || ri > fillEndRow) return row;
          const newValues = { ...row.values };
          for (let ci = fillStartCol; ci <= fillEndCol; ci++) {
            if (ci >= dataset.columns.length) break;
            const col = dataset.columns[ci];
            const srcRowIdx = sr1 + ((ri - sr1) % srcRows);
            const srcColIdx = sc1 + ((ci - sc1) % srcCols);
            const srcRow = dataset.rows[srcRowIdx];
            newValues[col.id] = srcRow ? (srcRow.values[dataset.columns[srcColIdx]?.id] ?? null) : null;
          }
          return { ...row, values: newValues };
        });

        persistDataset({ ...dataset, rows: updatedRows });

        setSelectionRange({
          startRow: fillStartRow,
          startCol: fillStartCol,
          endRow: fillEndRow,
          endCol: fillEndCol,
        });
        setActiveCell(positionToCell(fillStartRow, fillStartCol));

        isFillDraggingRef.current = false;
        fillSourceRef.current = null;
        setDragOverCell(null);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        return;
      }

      // ── Cell drag drop ──
      if (!isDragging || !dataset || !selectionRange) return;

      setIsDragging(false);
      setDragOverCell(null);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";

      const sourceData = getSelectedCellsData();
      if (sourceData.length === 0) return;

      const sourceRange = clampRange(selectionRange);
      const sr1 = Math.min(sourceRange.startRow, sourceRange.endRow);
      const sc1 = Math.min(sourceRange.startCol, sourceRange.endCol);

      // Don't drop on self
      if (targetRow >= sr1 && targetRow <= sr1 + sourceData.length - 1 &&
          targetCol >= sc1 && targetCol <= sc1 + (sourceData[0]?.length ?? 1) - 1) {
        return;
      }

      const isCopy = e.ctrlKey || e.metaKey;

      const updatedRows = dataset.rows.map((row, ri) => {
        const dr = ri - targetRow;
        if (dr < 0 || dr >= sourceData.length) return row;
        const newValues = { ...row.values };
        for (let dc = 0; dc < sourceData[dr].length; dc++) {
          const targetCi = targetCol + dc;
          if (targetCi >= dataset.columns.length) break;
          const col = dataset.columns[targetCi];
          newValues[col.id] = sourceData[dr][dc];
        }
        return { ...row, values: newValues };
      });

      if (!isCopy) {
        for (let dr = 0; dr < sourceData.length; dr++) {
          const sourceRow = updatedRows[sr1 + dr];
          if (!sourceRow) continue;
          const newValues = { ...sourceRow.values };
          for (let dc = 0; dc < (sourceData[dr]?.length ?? 0); dc++) {
            const sourceCi = sc1 + dc;
            if (sourceCi >= dataset.columns.length) break;
            const col = dataset.columns[sourceCi];
            newValues[col.id] = null;
          }
          updatedRows[sr1 + dr] = { ...sourceRow, values: newValues };
        }
      }

      persistDataset({ ...dataset, rows: updatedRows });

      const pastedRows = sourceData.length;
      const pastedCols = sourceData[0]?.length ?? 1;
      setSelectionRange({
        startRow: targetRow,
        startCol: targetCol,
        endRow: targetRow + pastedRows - 1,
        endCol: targetCol + pastedCols - 1,
      });
      setActiveCell(positionToCell(targetRow, targetCol));
    },
    [isDragging, dataset, selectionRange, getSelectedCellsData, clampRange, persistDataset, positionToCell],
  );

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, [handleMouseUp]);

  // ── Spreadsheet: Context menu ─────────────────────────────────

  const handleContextMenu = useCallback(
    (row: number, col: number, e: React.MouseEvent) => {
      const pos = positionToCell(row, col);
      setContextMenuCell(pos);
      selectCell(row, col);
    },
    [positionToCell, selectCell],
  );

  const insertRow = useCallback(
    (above: boolean) => {
      if (!dataset || !contextMenuCell) return;
      const targetIdx = rowIndexMap.get(contextMenuCell.rowId);
      if (targetIdx === undefined) return;

      const newRow: DatasetRow = {
        id: uuid(),
        values: Object.fromEntries(
          dataset.columns.map((c) => [c.id, c.type === "number" ? 0 : null]),
        ),
      };

      const insertIdx = above ? targetIdx : targetIdx + 1;
      const updatedRows = [...dataset.rows];
      updatedRows.splice(insertIdx, 0, newRow);
      persistDataset({ ...dataset, rows: updatedRows });
      setContextMenuCell(null);
    },
    [dataset, contextMenuCell, rowIndexMap, persistDataset],
  );

  const insertColumn = useCallback(
    (left: boolean) => {
      if (!dataset || !contextMenuCell) return;
      const targetIdx = colIndexMap.get(contextMenuCell.colId);
      if (targetIdx === undefined) return;

      const name = `Column ${dataset.columns.length + 1}`;
      const newCol: DatasetColumn = { id: uuid(), name, type: "string" };

      const insertIdx = left ? targetIdx : targetIdx + 1;
      const updatedColumns = [...dataset.columns];
      updatedColumns.splice(insertIdx, 0, newCol);

      const updatedRows = dataset.rows.map((r) => ({
        ...r,
        values: { ...r.values, [newCol.id]: null },
      }));

      persistDataset({ ...dataset, columns: updatedColumns, rows: updatedRows });
      setContextMenuCell(null);
    },
    [dataset, contextMenuCell, colIndexMap, persistDataset],
  );

  const deleteRow = useCallback(
    (rowId: string) => {
      if (!dataset) return;
      persistDataset({
        ...dataset,
        rows: dataset.rows.filter((r) => r.id !== rowId),
      });
    },
    [dataset, persistDataset],
  );

  const deleteColumn = useCallback(
    (colId: string) => {
      if (!dataset) return;
      const updatedColumns = dataset.columns.filter((c) => c.id !== colId);
      const updatedRows = dataset.rows.map((r) => {
        const newValues = { ...r.values };
        delete newValues[colId];
        return { ...r, values: newValues };
      });
      persistDataset({ ...dataset, columns: updatedColumns, rows: updatedRows });
    },
    [dataset, persistDataset],
  );

  // ── Spreadsheet: Keyboard handler (on table container) ──────

  const handleTableKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // If a cell is being edited, only handle Escape and Enter; let all other keys go to the input
      if (editingCell) {
        if (e.key === "Escape") {
          e.preventDefault();
          cancelEdit();
          tableRef.current?.focus();
        } else if (e.key === "Enter") {
          e.preventDefault();
          commitEditAndMove(1, 0);
        } else if (e.key === "Tab") {
          e.preventDefault();
          commitEditAndMove(0, e.shiftKey ? -1 : 1);
        }
        return;
      }

      const mod = e.metaKey || e.ctrlKey;

      // Navigation
      if (e.key === "ArrowDown") { e.preventDefault(); moveActiveCell(1, 0, e.shiftKey); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); moveActiveCell(-1, 0, e.shiftKey); return; }
      if (e.key === "ArrowRight") { e.preventDefault(); moveActiveCell(0, 1, e.shiftKey); return; }
      if (e.key === "ArrowLeft") { e.preventDefault(); moveActiveCell(0, -1, e.shiftKey); return; }
      if (e.key === "Tab") { e.preventDefault(); moveActiveCell(0, e.shiftKey ? -1 : 1); return; }
      if (e.key === "Enter") {
        e.preventDefault();
        if (activeCell) startEditing(activeCell.rowId, activeCell.colId);
        return;
      }
      if (e.key === "F2") {
        e.preventDefault();
        if (activeCell) startEditing(activeCell.rowId, activeCell.colId);
        return;
      }

      // Clipboard
      if (mod && e.key === "c") { e.preventDefault(); handleCopy(); return; }
      if (mod && e.key === "x") { e.preventDefault(); handleCut(); return; }
      if (mod && e.key === "v") { e.preventDefault(); handlePaste(); return; }

      // Delete
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        handleDeleteSelected();
        return;
      }

      // Start editing by typing a character
      if (e.key.length === 1 && !mod && activeCell && dataset) {
        e.preventDefault();
        setEditValue(e.key);
        setEditingCell(activeCell);
      }
    },
    [
      editingCell, activeCell, dataset, cancelEdit, commitEditAndMove,
      moveActiveCell, startEditing, handleCopy, handleCut, handlePaste,
      handleDeleteSelected,
    ],
  );

  // ── Spreadsheet: Cell rendering helpers ──────────────────────

  const isInSelection = useCallback(
    (row: number, col: number): boolean => {
      if (!selectionRange) return false;
      const range = clampRange(selectionRange);
      const r1 = Math.min(range.startRow, range.endRow);
      const r2 = Math.max(range.startRow, range.endRow);
      const c1 = Math.min(range.startCol, range.endCol);
      const c2 = Math.max(range.startCol, range.endCol);
      return row >= r1 && row <= r2 && col >= c1 && col <= c2;
    },
    [selectionRange, clampRange],
  );

  const isActive = useCallback(
    (row: number, col: number): boolean => {
      return activeCellPos?.row === row && activeCellPos?.col === col;
    },
    [activeCellPos],
  );

  const isCellEditing = useCallback(
    (rowId: string, colId: string): boolean => {
      return editingCell?.rowId === rowId && editingCell?.colId === colId;
    },
    [editingCell],
  );

  // ── Existing handlers (unchanged logic) ──────────────────────

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
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <table
                ref={tableRef}
                className={`w-full border-collapse text-sm ${isTableGrabbing ? "cursor-grabbing [&_*]:cursor-grabbing" : ""}`}
                tabIndex={0}
                onKeyDown={handleTableKeyDown}
                onPaste={handlePaste}
              >
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
                  {dataset.columns.map((col, colIdx) => {
                    const cellKey = `${row.id}:${col.id}`;
                    const hasError = validationErrors.get(cellKey) ?? false;
                    const editing = isCellEditing(row.id, col.id);
                    const selected = isInSelection(rowIdx, colIdx);
                    const active = isActive(rowIdx, colIdx);
                    const isDragOver =
                      dragOverCell?.rowId === row.id && dragOverCell?.colId === col.id;
                    const isHoveredBorder =
                      hoveredCellBorder &&
                      dragStartRef.current === null &&
                      !editing;
                    const showFillHandle = selected && !editing && !isDragging;
                    const val = row.values[col.id];

                    let cellClass = "relative border border-border px-2 py-1 ";
                    if (hasError) cellClass += "bg-destructive/10 ";
                    if (editing) {
                      cellClass += "bg-accent ";
                    } else if (active) {
                      cellClass += "ring-2 ring-primary ring-inset ";
                    } else if (selected) {
                      cellClass += "bg-primary/10 ";
                    }
                    if (isDragOver && isDragging) {
                      cellClass += "border-dashed border-2 border-primary ";
                    }
                    if (!editing) {
                      if (hoveredFillHandle) cellClass += "cursor-crosshair ";
                      else if (isHoveredBorder) cellClass += "cursor-grab ";
                      else cellClass += "cursor-cell ";
                    }

                    return (
                      <td
                        key={col.id}
                        data-row-index={rowIdx}
                        data-col-index={colIdx}
                        className={cellClass}
                        onMouseDown={(e) => handleCellMouseDown(rowIdx, colIdx, e)}
                        onMouseMove={(e) => handleCellMouseMove(rowIdx, colIdx, e)}
                        onMouseUp={(e) => handleCellDrop(rowIdx, colIdx, e)}
                        onMouseLeave={() => {
                          setHoveredCellBorder(false);
                          setHoveredFillHandle(false);
                        }}
                        onContextMenu={(e) => handleContextMenu(rowIdx, colIdx, e)}
                        onDoubleClick={() => {
                          if (!editing) startEditing(row.id, col.id);
                        }}
                      >
                        {editing ? (
                          <Input
                            ref={editInputRef}
                            className="h-6 w-full text-xs"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") commitEditAndMove(1, 0);
                              if (e.key === "Escape") {
                                cancelEdit();
                                tableRef.current?.focus();
                              }
                              if (e.key === "Tab") {
                                e.preventDefault();
                                commitEditAndMove(0, e.shiftKey ? -1 : 1);
                              }
                              e.stopPropagation();
                            }}
                            onBlur={commitEdit}
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
                        {showFillHandle && (
                          <div
                            className="absolute bottom-[-3px] right-[-3px] h-[6px] w-[6px] cursor-crosshair rounded-sm border border-primary bg-primary"
                          />
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
            </ContextMenuTrigger>

          <ContextMenuContent className="w-56">
            <ContextMenuItem onClick={() => { handleCut(); setContextMenuCell(null); }}>
              <Scissors className="mr-2 h-4 w-4" />
              {t("dataEditor.contextCut")}
              <ContextMenuShortcut>Ctrl+X</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => { handleCopy(); setContextMenuCell(null); }}>
              <Copy className="mr-2 h-4 w-4" />
              {t("dataEditor.contextCopy")}
              <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => { handlePaste(); setContextMenuCell(null); }}>
              <ClipboardPaste className="mr-2 h-4 w-4" />
              {t("dataEditor.contextPaste")}
              <ContextMenuShortcut>Ctrl+V</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => { handleDeleteSelected(); setContextMenuCell(null); }}>
              <Trash2 className="mr-2 h-4 w-4" />
              {t("dataEditor.contextDelete")}
              <ContextMenuShortcut>Del</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => insertRow(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("dataEditor.contextInsertRowAbove")}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => insertRow(false)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("dataEditor.contextInsertRowBelow")}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={() => insertColumn(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("dataEditor.contextInsertColLeft")}
            </ContextMenuItem>
            <ContextMenuItem onClick={() => insertColumn(false)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("dataEditor.contextInsertColRight")}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => {
                if (contextMenuCell) deleteRow(contextMenuCell.rowId);
                setContextMenuCell(null);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t("dataEditor.contextDeleteRow")}
            </ContextMenuItem>
            <ContextMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => {
                if (contextMenuCell) deleteColumn(contextMenuCell.colId);
                setContextMenuCell(null);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t("dataEditor.contextDeleteCol")}
            </ContextMenuItem>
          </ContextMenuContent>

          {dataset.rows.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
              <Table className="h-8 w-8 opacity-40" />
              <p className="text-xs">{t("dataEditor.noRowsHint")}</p>
            </div>
          )}
          </ContextMenu>
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
