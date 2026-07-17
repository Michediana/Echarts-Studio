import { useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  FilePlus,
  FolderOpen,
  Save,
  SaveAll,
  Undo,
  Redo,
  Sun,
  Moon,
  Download,
  Search,
  Eye,
  EyeOff,
  Settings,
  BarChart3,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { useT } from "@/lib/i18n/context";
import { useLanguage } from "@/lib/i18n/context";
import { LANGUAGES } from "@/lib/i18n/translations";
import { useProjectStore } from "@/stores/projectStore";
import { useUIStore } from "@/stores/uiStore";
import { chartTemplates } from "@/templates/index";

const CHART_TYPES = [
  { value: "_none", label: "Select chart type" },
  ...chartTemplates.map((t) => ({ value: t.id, label: t.name })),
];

interface ToolbarButtonProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

function ToolbarButton({ icon: Icon, label, onClick, disabled }: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
        >
          <Icon className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

export function Toolbar() {
  const t = useT();
  const { language, setLanguage } = useLanguage();
  const currentProject = useProjectStore((s) => s.currentProject);
  const isDirty = useProjectStore((s) => s.isDirty);
  const createProject = useProjectStore((s) => s.createProject);
  const openProject = useProjectStore((s) => s.openProject);
  const saveProject = useProjectStore((s) => s.saveProject);
  const saveProjectAs = useProjectStore((s) => s.saveProjectAs);

  const theme = useUIStore((s) => s.theme);
  const mode = useUIStore((s) => s.mode);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const toggleMode = useUIStore((s) => s.toggleMode);
  const openCommandPalette = useUIStore((s) => s.openCommandPalette);

  const handleNew = useCallback(() => {
    createProject();
  }, [createProject]);

  const handleOpen = useCallback(async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-dialog");
      const path = await open({
        filters: [{ name: "ECharts Project", extensions: ["echarts.json", "json"] }],
        multiple: false,
      });
      if (path) {
        await openProject(path as string);
      }
    } catch (err) {
      console.error("Failed to open file dialog:", err);
    }
  }, [openProject]);

  const handleSave = useCallback(async () => {
    try {
      await saveProject();
    } catch (err) {
      console.error("Failed to save:", err);
    }
  }, [saveProject]);

  const handleSaveAs = useCallback(async () => {
    try {
      const { save } = await import("@tauri-apps/plugin-dialog");
      const path = await save({
        filters: [{ name: "ECharts Project", extensions: ["echarts.json", "json"] }],
      });
      if (path) {
        await saveProjectAs(path);
      }
    } catch (err) {
      console.error("Failed to save as:", err);
    }
  }, [saveProjectAs]);

  const handleExport = useCallback(async () => {
    try {
      const { save } = await import("@tauri-apps/plugin-dialog");
      const path = await save({
        filters: [{ name: "PNG Image", extensions: ["png"] }],
        defaultPath: "chart.png",
      });
      if (path) {
        const canvas = document.querySelector("canvas") as HTMLCanvasElement | null;
        if (canvas) {
          const dataUrl = canvas.toDataURL("image/png");
          await invoke("export_image", { path, data: dataUrl });
        }
      }
    } catch (err) {
      console.error("Failed to export:", err);
    }
  }, []);

  const hasProject = currentProject !== null;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-11 shrink-0 items-center border-b bg-background px-2 gap-1">
        {/* Left section: App name + file operations */}
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1.5 pr-2 select-none">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold tracking-tight">
              {t("toolbar.appName")}
            </span>
          </div>

          <Separator orientation="vertical" className="h-5 mx-1" />

          <ToolbarButton
            icon={FilePlus}
            label={t("toolbar.newProject")}
            onClick={handleNew}
          />
          <ToolbarButton
            icon={FolderOpen}
            label={t("toolbar.openProject")}
            onClick={handleOpen}
          />
          <ToolbarButton
            icon={Save}
            label={isDirty ? t("toolbar.save") : t("toolbar.saveNoChanges")}
            onClick={handleSave}
            disabled={!hasProject}
          />
          <ToolbarButton
            icon={SaveAll}
            label={t("toolbar.saveAs")}
            onClick={handleSaveAs}
            disabled={!hasProject}
          />
        </div>

        {/* Center section: Chart type + Undo/Redo */}
        <div className="flex-1 flex items-center justify-center gap-1">
          <Select disabled={!hasProject}>
            <SelectTrigger className="h-7 w-[200px] text-xs">
              <SelectValue placeholder="Select chart type" />
            </SelectTrigger>
            <SelectContent>
              {CHART_TYPES.map((ct) => (
                <SelectItem key={ct.value} value={ct.value}>
                  <span className="text-xs">{ct.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-5 mx-1" />

          <ToolbarButton icon={Undo} label={t("toolbar.undo")} disabled />
          <ToolbarButton icon={Redo} label={t("toolbar.redo")} disabled />
        </div>

        {/* Right section: Mode, Theme, Export, Command Palette */}
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1.5 mr-1">
            {mode === "basic" ? (
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <Switch
              checked={mode === "advanced"}
              onCheckedChange={toggleMode}
              aria-label={t("toolbar.toggleAdvancedMode")}
              className="h-4 w-7"
            />
            <span className="text-[10px] text-muted-foreground w-12 select-none">
              {mode === "basic" ? t("toolbar.modeBasic") : t("toolbar.modeAdvanced")}
            </span>
          </div>

          <Separator orientation="vertical" className="h-5 mx-1" />

          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="h-7 w-[70px] text-xs" aria-label="Language">
              <Globe className="h-3.5 w-3.5 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code} className="text-xs">
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ToolbarButton
            icon={theme === "dark" ? Sun : Moon}
            label={theme === "dark" ? t("toolbar.switchToLightTheme") : t("toolbar.switchToDarkTheme")}
            onClick={toggleTheme}
          />
          <ToolbarButton
            icon={Download}
            label={t("toolbar.exportChartAsImage")}
            onClick={handleExport}
            disabled={!hasProject}
          />
          <ToolbarButton
            icon={Search}
            label={t("toolbar.commandPalette")}
            onClick={openCommandPalette}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
