import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useUIStore } from "@/stores/uiStore";
import { useT } from "@/lib/i18n/context";
import { useProjectStore } from "@/stores/projectStore";
import {
  Search,
  FilePlus,
  FolderOpen,
  Save,
  Sun,
  Moon,
  Download,
  Settings,
  Eye,
  EyeOff,
  Layout,
  PanelLeft,
  PanelRight,
  PanelBottom,
  Maximize,
  Minimize,
  Undo,
  Redo,
  Copy,
  Trash2,
  BarChart3,
  LineChart,
  PieChart,
  Plus,
  Database,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Command {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  action: () => void;
  shortcut?: string;
  disabled?: boolean;
  section: string;
}

interface CommandSection {
  label: string;
  commands: Command[];
}

function getIsMac(): boolean {
  if (typeof navigator !== "undefined") {
    return navigator.platform.toUpperCase().includes("MAC");
  }
  return false;
}

function modKey(): string {
  return getIsMac() ? "⌘" : "Ctrl";
}

export default function CommandPalette() {
  const t = useT();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commandPaletteOpen = useUIStore((s) => s.commandPaletteOpen);
  const openCommandPalette = useUIStore((s) => s.openCommandPalette);
  const closeCommandPalette = useUIStore((s) => s.closeCommandPalette);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const toggleInspector = useUIStore((s) => s.toggleInspector);
  const toggleBottomPanel = useUIStore((s) => s.toggleBottomPanel);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const toggleMode = useUIStore((s) => s.toggleMode);
  const theme = useUIStore((s) => s.theme);

  const createProject = useProjectStore((s) => s.createProject);
  const saveProject = useProjectStore((s) => s.saveProject);
  const setChartType = useProjectStore((s) => s.setChartType);
  const undo = useProjectStore((s) => s.undo);
  const redo = useProjectStore((s) => s.redo);
  const canUndo = useProjectStore((s) => s.canUndo);
  const canRedo = useProjectStore((s) => s.canRedo);

  const mk = modKey();

  const sections = useMemo((): CommandSection[] => {
    return [
      {
        label: t("commandPalette.sectionFile"),
        commands: [
          {
            id: "new-project",
            label: t("commandPalette.newProject"),
            description: t("commandPalette.newProjectDesc"),
            icon: FilePlus,
            action: () => { createProject(); closeCommandPalette(); },
            shortcut: `${mk}+N`,
            section: t("commandPalette.sectionFile"),
          },
          {
            id: "open-project",
            label: t("commandPalette.openProject"),
            description: t("commandPalette.openProjectDesc"),
            icon: FolderOpen,
            action: () => { closeCommandPalette(); },
            shortcut: `${mk}+O`,
            section: t("commandPalette.sectionFile"),
          },
          {
            id: "save",
            label: t("commandPalette.save"),
            description: t("commandPalette.saveDesc"),
            icon: Save,
            action: () => { saveProject(); closeCommandPalette(); },
            shortcut: `${mk}+S`,
            section: t("commandPalette.sectionFile"),
          },
          {
            id: "save-as",
            label: t("commandPalette.saveAs"),
            description: t("commandPalette.saveAsDesc"),
            icon: Save,
            action: () => { closeCommandPalette(); },
            shortcut: `${mk}+Shift+S`,
            section: t("commandPalette.sectionFile"),
          },
          {
            id: "export-png",
            label: t("commandPalette.exportPng"),
            description: t("commandPalette.exportPngDesc"),
            icon: Download,
            action: () => { closeCommandPalette(); },
            section: t("commandPalette.sectionFile"),
          },
          {
            id: "export-json",
            label: t("commandPalette.exportJson"),
            description: t("commandPalette.exportJsonDesc"),
            icon: Download,
            action: () => { closeCommandPalette(); },
            section: t("commandPalette.sectionFile"),
          },
        ],
      },
      {
        label: t("commandPalette.sectionView"),
        commands: [
          {
            id: "toggle-sidebar",
            label: t("commandPalette.toggleSidebar"),
            description: t("commandPalette.toggleSidebarDesc"),
            icon: PanelLeft,
            action: () => { toggleSidebar(); closeCommandPalette(); },
            section: t("commandPalette.sectionView"),
          },
          {
            id: "toggle-inspector",
            label: t("commandPalette.toggleInspector"),
            description: t("commandPalette.toggleInspectorDesc"),
            icon: PanelRight,
            action: () => { toggleInspector(); closeCommandPalette(); },
            section: t("commandPalette.sectionView"),
          },
          {
            id: "toggle-bottom-panel",
            label: t("commandPalette.toggleBottomPanel"),
            description: t("commandPalette.toggleBottomPanelDesc"),
            icon: PanelBottom,
            action: () => { toggleBottomPanel(); closeCommandPalette(); },
            section: t("commandPalette.sectionView"),
          },
          {
            id: "toggle-theme",
            label: t("commandPalette.toggleDarkLight"),
            description: theme === "dark" ? t("commandPalette.switchToLight") : t("commandPalette.switchToDark"),
            icon: theme === "dark" ? Sun : Moon,
            action: () => { toggleTheme(); closeCommandPalette(); },
            shortcut: `${mk}+Shift+L`,
            section: t("commandPalette.sectionView"),
          },
          {
            id: "toggle-mode",
            label: t("commandPalette.toggleBasicAdvanced"),
            description: t("commandPalette.toggleBasicAdvancedDesc"),
            icon: Maximize,
            action: () => { toggleMode(); closeCommandPalette(); },
            section: t("commandPalette.sectionView"),
          },
        ],
      },
      {
        label: t("commandPalette.sectionEdit"),
        commands: [
          {
            id: "undo",
            label: t("commandPalette.undo"),
            description: t("commandPalette.undoDesc"),
            icon: Undo,
            action: () => { undo(); closeCommandPalette(); },
            shortcut: `${mk}+Z`,
            disabled: !canUndo(),
            section: t("commandPalette.sectionEdit"),
          },
          {
            id: "redo",
            label: t("commandPalette.redo"),
            description: t("commandPalette.redoDesc"),
            icon: Redo,
            action: () => { redo(); closeCommandPalette(); },
            shortcut: `${mk}+Shift+Z`,
            disabled: !canRedo(),
            section: t("commandPalette.sectionEdit"),
          },
        ],
      },
      {
        label: t("commandPalette.sectionChart"),
        commands: [
          {
            id: "chart-bar",
            label: t("commandPalette.barChart"),
            description: "Switch to bar chart",
            icon: BarChart3,
            action: () => { setChartType("bar"); closeCommandPalette(); },
            section: t("commandPalette.sectionChart") as string,
          },
          {
            id: "chart-line",
            label: t("commandPalette.lineChart"),
            description: "Switch to line chart",
            icon: LineChart,
            action: () => { setChartType("line"); closeCommandPalette(); },
            section: t("commandPalette.sectionChart") as string,
          },
          {
            id: "chart-pie",
            label: t("commandPalette.pieChart"),
            description: "Switch to pie chart",
            icon: PieChart,
            action: () => { setChartType("pie"); closeCommandPalette(); },
            section: t("commandPalette.sectionChart") as string,
          },
          {
            id: "chart-scatter",
            label: t("commandPalette.scatterChart"),
            description: "Switch to scatter chart",
            icon: Copy,
            action: () => { setChartType("scatter"); closeCommandPalette(); },
            section: t("commandPalette.sectionChart") as string,
          },
          {
            id: "chart-radar",
            label: t("commandPalette.radarChart"),
            description: "Switch to radar chart",
            icon: Layout,
            action: () => { setChartType("radar"); closeCommandPalette(); },
            section: t("commandPalette.sectionChart") as string,
          },
        ],
      },
      {
        label: t("commandPalette.sectionHelp"),
        commands: [
          {
            id: "docs",
            label: t("commandPalette.documentation"),
            description: t("commandPalette.documentationDesc"),
            icon: Settings,
            action: () => { closeCommandPalette(); },
            section: t("commandPalette.sectionHelp"),
          },
        ],
      },
    ];
  }, [t, mk, theme, createProject, saveProject, setChartType, toggleSidebar, toggleInspector, toggleBottomPanel, toggleTheme, toggleMode, closeCommandPalette]);

  const filtered = useMemo(() => {
    if (!query.trim()) return sections;
    const q = query.toLowerCase();
    return sections
      .map((section) => ({
        ...section,
        commands: section.commands.filter(
          (cmd) =>
            cmd.label.toLowerCase().includes(q) ||
            cmd.description.toLowerCase().includes(q) ||
            cmd.section.toLowerCase().includes(q),
        ),
      }))
      .filter((section) => section.commands.length > 0);
  }, [sections, query]);

  const flatCommands = useMemo(() => {
    return filtered.flatMap((s) => s.commands);
  }, [filtered]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery("");
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [commandPaletteOpen]);

  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector(`[data-command-index="${activeIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => (prev + 1) % flatCommands.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => (prev - 1 + flatCommands.length) % flatCommands.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        const cmd = flatCommands[activeIndex];
        if (cmd && !cmd.disabled) {
          cmd.action();
        }
      }
    },
    [flatCommands, activeIndex],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key === "k") {
        e.preventDefault();
        if (commandPaletteOpen) {
          closeCommandPalette();
        } else {
          openCommandPalette();
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [commandPaletteOpen, openCommandPalette, closeCommandPalette]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) closeCommandPalette();
    },
    [closeCommandPalette],
  );

  let runningIndex = -1;

  return (
    <Dialog open={commandPaletteOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-w-xl gap-0 p-0 overflow-hidden"
        onKeyDown={handleKeyDown}
        aria-label={t("commandPalette.ariaLabel")}
      >
        <div className="flex items-center gap-3 border-b px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("commandPalette.searchPlaceholder")}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label="Search commands"
            role="combobox"
            aria-expanded="true"
            aria-controls="command-list"
            aria-activedescendant={
              flatCommands[activeIndex] ? `command-${flatCommands[activeIndex].id}` : undefined
            }
          />
          <kbd className="pointer-events-none hidden select-none rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
            esc
          </kbd>
        </div>

        <div
          ref={listRef}
          id="command-list"
          role="listbox"
          aria-label="Commands"
          className="max-h-[400px] overflow-y-auto p-2"
        >
          {filtered.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t("commandPalette.noCommandsFound")}
            </div>
          )}

          {filtered.map((section) => (
            <div key={section.label} role="group" aria-label={section.label}>
              <div className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {section.label}
              </div>
              {section.commands.map((cmd) => {
                runningIndex += 1;
                const idx = runningIndex;
                const isActive = idx === activeIndex;
                const Icon = cmd.icon;

                return (
                  <div
                    key={cmd.id}
                    id={`command-${cmd.id}`}
                    data-command-index={idx}
                    role="option"
                    aria-selected={isActive}
                    aria-disabled={cmd.disabled}
                    className={`flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 text-sm transition-colors ${
                      isActive ? "bg-accent text-accent-foreground" : ""
                    } ${cmd.disabled ? "pointer-events-none opacity-40" : "hover:bg-accent hover:text-accent-foreground"}`}
                    onClick={() => {
                      if (!cmd.disabled) {
                        setActiveIndex(idx);
                        cmd.action();
                      }
                    }}
                    onMouseEnter={() => setActiveIndex(idx)}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <div className="flex flex-1 flex-col">
                      <span className="font-medium">{cmd.label}</span>
                      <span className="text-xs text-muted-foreground">{cmd.description}</span>
                    </div>
                    {cmd.shortcut && (
                      <kbd className="pointer-events-none hidden select-none shrink-0 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-block">
                        {cmd.shortcut}
                      </kbd>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
