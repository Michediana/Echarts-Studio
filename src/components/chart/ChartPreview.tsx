import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { RefreshCw, Maximize2, Minimize2, FileImage, AlertCircle } from "lucide-react";
import { useProjectStore } from "@/stores/projectStore";
import { useUIStore } from "@/stores/uiStore";
import { resolveOption } from "@/lib/chart/resolveOption";
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

  const handleToggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    if (!document.fullscreenElement) {
      el.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

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
        "relative h-full w-full overflow-hidden",
        "rounded-md border border-border bg-background",
        isFullscreen && "rounded-none border-0"
      )}
    >
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
        chartRef={chartRef}
      />
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
