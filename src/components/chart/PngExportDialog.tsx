import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/lib/i18n/context";
import { useUIStore } from "@/stores/uiStore";
import { useProjectStore } from "@/stores/projectStore";
import { resolveOption } from "@/lib/chart/resolveOption";

const DPI_OPTIONS = [72, 96, 150, 300, 600];

interface PngExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PngExportDialog({
  open,
  onOpenChange,
}: PngExportDialogProps) {
  const t = useT();
  const theme = useUIStore((s) => s.theme);
  const currentProject = useProjectStore((s) => s.currentProject);

  const [width, setWidth] = useState("1920");
  const [height, setHeight] = useState("1080");
  const [dpi, setDpi] = useState("300");
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (!currentProject) return;

    const w = parseInt(width, 10);
    const h = parseInt(height, 10);
    const d = parseInt(dpi, 10);
    if (!w || !h || !d) return;

    setExporting(true);
    try {
      const option = resolveOption(currentProject);
      const bg = theme === "dark" ? "#1a1a2e" : "#ffffff";
      const echartsTheme = theme === "dark" ? "dark" : undefined;
      const renderer = currentProject.chart?.renderer ?? "canvas";

      const container = document.createElement("div");
      container.style.cssText = `width:${w}px;height:${h}px;position:absolute;left:0;top:0;visibility:hidden;pointer-events:none;`;
      document.body.appendChild(container);

      const echarts = await import("echarts");
      const offscreen = echarts.init(container, echartsTheme, {
        width: w,
        height: h,
        renderer,
        useDirtyRect: false,
        // Snapshot resolution is controlled solely by getDataURL's pixelRatio.
        // Pin the base ratio to 1 so a HiDPI screen doesn't scale it a second time.
        devicePixelRatio: 1,
      });

      // Disable entry animations: getDataURL captures a single frame, so with
      // animation on the series (bars/lines) would still be at their initial
      // state (height 0 / not yet drawn), leaving only axes and legend visible.
      const staticOption = { ...option, animation: false };
      offscreen.setOption(staticOption, true);

      // Wait until ECharts has finished laying out and painting before capture.
      await new Promise<void>((resolve) => {
        let settled = false;
        const done = () => {
          if (settled) return;
          settled = true;
          resolve();
        };
        offscreen.on("finished", done);
        // Fallback in case "finished" doesn't fire (e.g. empty series).
        requestAnimationFrame(() => requestAnimationFrame(done));
      });

      // The image is exactly w × h pixels; DPI is written as PNG metadata
      // (pHYs chunk) so it only affects the physical print size, not the
      // pixel dimensions.
      const dataUrl = offscreen.getDataURL({
        type: "png",
        pixelRatio: 1,
        backgroundColor: bg,
      });

      offscreen.dispose();
      container.remove();

      const { save } = await import("@tauri-apps/plugin-dialog");
      const defaultName = `${currentProject?.metadata?.name ?? "chart"}.png`;
      const savePath = await save({
        defaultPath: defaultName,
        filters: [{ name: "PNG Image", extensions: ["png"] }],
      });
      if (!savePath) {
        setExporting(false);
        return;
      }

      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("export_image", { path: savePath, data: dataUrl, dpi: d });

      onOpenChange(false);
    } catch (err) {
      console.error("PNG export failed:", err);
    } finally {
      setExporting(false);
    }
  }, [currentProject, width, height, dpi, theme, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("chartPreview.exportPngTitle")}</DialogTitle>
          <DialogDescription>
            {t("chartPreview.exportPngDesc")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {t("chartPreview.width")}
              </label>
              <Input
                type="number"
                min={1}
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {t("chartPreview.height")}
              </label>
              <Input
                type="number"
                min={1}
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              {t("chartPreview.dpi")}
            </label>
            <Select value={dpi} onValueChange={setDpi}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DPI_OPTIONS.map((d) => (
                  <SelectItem key={d} value={String(d)}>
                    {d} DPI
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-[11px] text-muted-foreground">
            {t("chartPreview.outputSize")}: {width} × {height} px @ {dpi} DPI
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            {t("chartPreview.cancel")}
          </Button>
          <Button size="sm" onClick={handleExport} disabled={exporting}>
            {exporting ? t("chartPreview.exporting") : t("chartPreview.export")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
