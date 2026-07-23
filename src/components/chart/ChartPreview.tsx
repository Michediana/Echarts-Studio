import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import {
  RefreshCw,
  Maximize2,
  Minimize2,
  FileImage,
  AlertCircle,
  Link2,
  Unlink,
  RotateCcw,
  Table2,
  Database,
} from "lucide-react";
import { useProjectStore } from "@/stores/projectStore";
import { useUIStore } from "@/stores/uiStore";
import { resolveOption } from "@/lib/chart/resolveOption";
import { countOverrides, getChartMode } from "@/lib/chart/overrideStatus";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/context";
import PngExportDialog from "./PngExportDialog";
import ChartErrorBoundary from "./ChartErrorBoundary";

const EMPTY_OPTION = {};

export default function ChartPreview() {
  const t = useT();
  const chartRef = useRef<ReactECharts | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pngExportOpen, setPngExportOpen] = useState(false);
  const [dpr, setDpr] = useState(() => window.devicePixelRatio || 1);

  const currentProject = useProjectStore((s) => s.currentProject);
  const theme = useUIStore((s) => s.theme);

  const chartOption = useMemo(
    () => (currentProject ? resolveOption(currentProject) : EMPTY_OPTION),
    [currentProject],
  );
  const renderer = currentProject?.chart?.renderer ?? "canvas";
  const echartsTheme = theme === "dark" ? "dark" : undefined;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(() => {
      const instance = chartRef.current?.getEchartsInstance();
      if (instance) {
        instance.resize();
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Keep devicePixelRatio reactive: moving the window to a monitor with a
  // different DPI must re-render the chart at the correct resolution, otherwise
  // exports come out blurry.
  useEffect(() => {
    const update = () => setDpr(window.devicePixelRatio || 1);
    const mq = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
    mq.addEventListener("change", update);
    window.addEventListener("resize", update);
    return () => {
      mq.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, [dpr]);

  const handleRefresh = useCallback(() => {
    try {
      const instance = chartRef.current?.getEchartsInstance();
      if (instance) {
        instance.resize();
      }
    } catch (err) {
      console.error("Chart refresh failed:", err);
      setError(err instanceof Error ? err.message : t("chartPreview.failedRefresh"));
    }
  }, [t]);

  // Uses CSS "fake" fullscreen (fixed overlay) instead of the native
  // Fullscreen API, which is unsupported/unreliable in WKWebView on macOS
  // (Tauri) and silently fails there.
  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // Resize the chart after the container switches to/from the fullscreen
  // overlay, since its dimensions change.
  useEffect(() => {
    const instance = chartRef.current?.getEchartsInstance();
    if (instance) {
      instance.resize();
    }
  }, [isFullscreen]);

  // Allow exiting fullscreen with Escape.
  useEffect(() => {
    if (!isFullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullscreen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isFullscreen]);

  if (!currentProject) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <AlertCircle className="h-12 w-12 opacity-40" />
        <p className="text-sm">{t("chartPreview.openOrCreate")}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col bg-background",
        isFullscreen
          ? "fixed inset-0 z-50 h-screen w-screen rounded-none border-0"
          : "h-full w-full overflow-hidden rounded-md border border-border"
      )}
    >
      {!isFullscreen && <ChartStatusBar />}

      <div className="relative flex-1 overflow-hidden">
      <ChartErrorBoundary
        onError={(err) => {
          console.error("Chart render error:", err);
          setError(err.message);
        }}
        renderError={(err, reset) => (
          <div className="absolute inset-x-0 top-0 z-20 flex items-start gap-2 border-b border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="flex-1 text-xs">{err.message}</p>
            <button
              className="rounded-sm px-2 py-0.5 text-[11px] font-medium hover:bg-destructive/20"
              onClick={reset}
            >
              {t("chartPreview.dismiss")}
            </button>
          </div>
        )}
      >
        <ReactECharts
          ref={chartRef}
          option={chartOption}
          theme={echartsTheme}
          style={{ width: "100%", height: "100%" }}
          opts={{ renderer, devicePixelRatio: dpr }}
          notMerge
          lazyUpdate
        />
      </ChartErrorBoundary>

      {error && (
        <div className="absolute inset-x-0 bottom-0 z-20 flex items-start gap-2 border-t border-destructive/40 bg-destructive/10 px-3 py-2 text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="flex-1 text-xs">{error}</p>
          <button
            className="rounded-sm px-2 py-0.5 text-[11px] font-medium hover:bg-destructive/20"
            onClick={() => setError(null)}
          >
            {t("chartPreview.dismiss")}
          </button>
        </div>
      )}

      <div className="absolute right-2 top-2 flex gap-1 rounded-md border border-border bg-background/90 p-1 shadow-sm backdrop-blur-sm">
        <ToolbarButton
          icon={<RefreshCw className="h-3.5 w-3.5" />}
          tooltip={t("chartPreview.refresh")}
          onClick={handleRefresh}
        />
        <ToolbarButton
          icon={
            isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )
          }
          tooltip={isFullscreen ? t("chartPreview.exitFullscreen") : t("chartPreview.fullscreen")}
          onClick={handleToggleFullscreen}
        />
        <ToolbarButton
          icon={<FileImage className="h-3.5 w-3.5" />}
          tooltip={t("chartPreview.exportAsPng")}
          onClick={() => setPngExportOpen(true)}
        />
      </div>

      <PngExportDialog
        open={pngExportOpen}
        onOpenChange={setPngExportOpen}
      />
      </div>
    </div>
  );
}

function ToolbarButton({
  icon,
  tooltip,
  onClick,
  disabled = false,
}: {
  icon: React.ReactNode;
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="group relative">
      <button
        className={cn(
          "flex h-7 w-7 items-center justify-center rounded-sm text-muted-foreground transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          "disabled:pointer-events-none disabled:opacity-40"
        )}
        onClick={onClick}
        disabled={disabled}
      >
        {icon}
      </button>
      <div className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 -translate-x-1/2 whitespace-nowrap rounded bg-primary px-2 py-1 text-xs text-primary-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100">
        {tooltip}
      </div>
    </div>
  );
}

/**
 * A compact strip above the chart that makes the two invisible truths visible:
 * which dataset feeds the chart (or that it's a detached template), and how many
 * manual customizations sit on top — with one-click ways to switch source,
 * reattach, or reset.
 */
function ChartStatusBar() {
  const t = useT();
  const project = useProjectStore((s) => s.currentProject);
  const setSourceDataset = useProjectStore((s) => s.setSourceDataset);
  const clearOverrides = useProjectStore((s) => s.clearOverrides);
  const setCenterView = useUIStore((s) => s.setCenterView);

  const [resetOpen, setResetOpen] = useState(false);
  const [reattachOpen, setReattachOpen] = useState(false);

  const mode = useMemo(() => (project ? getChartMode(project) : "empty"), [project]);
  const overrideCount = useMemo(
    () => (project ? countOverrides(project.chart.overrides) : 0),
    [project],
  );

  if (!project) return null;

  const binding = project.chart.binding;
  const datasets = project.datasets;
  const firstDatasetId = datasets[0]?.id ?? null;

  const resetButton = overrideCount > 0 && (
    <button
      className="flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      onClick={() => setResetOpen(true)}
    >
      <RotateCcw className="h-3 w-3" />
      {t("chartStatus.reset")}
    </button>
  );

  return (
    <div className="flex h-8 shrink-0 items-center gap-2 border-b border-border bg-muted/30 px-3 text-xs">
      {mode === "bound" && binding && (
        <>
          <Link2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
          <span className="shrink-0 text-muted-foreground">{t("chartStatus.source")}</span>
          <Select value={binding.datasetId} onValueChange={setSourceDataset}>
            <SelectTrigger className="h-6 w-auto min-w-36 gap-1 border-0 bg-transparent px-1.5 text-xs font-medium hover:bg-accent focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {datasets.map((d) => (
                <SelectItem key={d.id} value={d.id} className="text-xs">
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            {binding.chartType}
          </Badge>
          <button
            className="flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            onClick={() => setCenterView("data")}
          >
            <Table2 className="h-3 w-3" />
            {t("chartStatus.editMapping")}
          </button>
        </>
      )}

      {mode === "detached" && (
        <>
          <Unlink className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          <span className="text-muted-foreground">{t("chartStatus.detached")}</span>
          {firstDatasetId && (
            <button
              className="flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              onClick={() => setReattachOpen(true)}
            >
              <Link2 className="h-3 w-3" />
              {t("chartStatus.reattach")}
            </button>
          )}
        </>
      )}

      {mode === "empty" && (
        <>
          <Database className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">{t("chartStatus.empty")}</span>
          {firstDatasetId && (
            <button
              className="flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              onClick={() => setSourceDataset(firstDatasetId)}
            >
              <Link2 className="h-3 w-3" />
              {t("chartStatus.linkData")}
            </button>
          )}
        </>
      )}

      <div className="flex-1" />

      {overrideCount > 0 && (
        <span className="shrink-0 text-[11px] text-muted-foreground">
          {t("chartStatus.customizations", { count: overrideCount })}
        </span>
      )}
      {resetButton}

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("chartStatus.resetTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("chartStatus.resetDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("chartStatus.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                clearOverrides();
                setResetOpen(false);
              }}
            >
              {t("chartStatus.reset")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={reattachOpen} onOpenChange={setReattachOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("chartStatus.reattachTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("chartStatus.reattachDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("chartStatus.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (firstDatasetId) setSourceDataset(firstDatasetId);
                setReattachOpen(false);
              }}
            >
              {t("chartStatus.reattach")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
