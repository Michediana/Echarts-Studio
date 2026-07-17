import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { RefreshCw, Maximize2, Minimize2, FileImage, AlertCircle } from "lucide-react";
import { useProjectStore } from "@/stores/projectStore";
import { useUIStore } from "@/stores/uiStore";
import { datasetToOption } from "@/lib/data/datasetToOption";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/context";

const EMPTY_OPTION = {};

export default function ChartPreview() {
  const t = useT();
  const chartRef = useRef<ReactECharts | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentProject = useProjectStore((s) => s.currentProject);
  const theme = useUIStore((s) => s.theme);

  const chartOption = useMemo(() => {
    if (!currentProject) return EMPTY_OPTION;
    const bindings = currentProject.bindings ?? [];
    if (bindings.length > 0) {
      const binding = bindings[0];
      const dataset = currentProject.datasets.find((d) => d.id === binding.datasetId);
      if (dataset && binding.series.length > 0) {
        return datasetToOption(dataset, binding);
      }
    }
    return currentProject.chart?.option ?? EMPTY_OPTION;
  }, [currentProject]);
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

  const handleExportPNG = useCallback(() => {
    try {
      const instance = chartRef.current?.getEchartsInstance();
      if (!instance) return;

      const url = instance.getDataURL({
        type: "png",
        pixelRatio: window.devicePixelRatio,
        backgroundColor: theme === "dark" ? "#1a1a2e" : "#ffffff",
      });

      const link = document.createElement("a");
      link.href = url;
      link.download = `${currentProject?.metadata?.name ?? "chart"}.png`;
      link.click();
    } catch (err) {
      console.error("PNG export failed:", err);
      setError(err instanceof Error ? err.message : t("chartPreview.failedExportPng"));
    }
  }, [theme, currentProject?.metadata?.name, t]);

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

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-destructive">
        <AlertCircle className="h-12 w-12" />
        <p className="max-w-md text-center text-sm">{error}</p>
        <button
          className="rounded-md bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80"
          onClick={() => setError(null)}
        >
          {t("chartPreview.dismiss")}
        </button>
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
      <ReactECharts
        ref={chartRef}
        option={chartOption}
        theme={echartsTheme}
        style={{ width: "100%", height: "100%" }}
        opts={{ renderer, devicePixelRatio: window.devicePixelRatio }}
        notMerge
        lazyUpdate
      />

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
          onClick={handleExportPNG}
        />
        <ToolbarButton
          icon={<FileImage className="h-3.5 w-3.5" />}
          tooltip={t("chartPreview.comingSoon")}
          onClick={() => {}}
          disabled
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
