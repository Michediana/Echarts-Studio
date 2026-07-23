import { useState, useCallback, type RefObject } from "react";
import type ReactECharts from "echarts-for-react";
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

const DPI_OPTIONS = [72, 96, 150, 300, 600];

interface PngExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chartRef: RefObject<ReactECharts | null>;
}

export default function PngExportDialog({
  open,
  onOpenChange,
  chartRef,
}: PngExportDialogProps) {
  const t = useT();
  const theme = useUIStore((s) => s.theme);
  const currentProject = useProjectStore((s) => s.currentProject);

  const [width, setWidth] = useState("1920");
  const [height, setHeight] = useState("1080");
  const [dpi, setDpi] = useState("300");
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    const instance = chartRef.current?.getEchartsInstance?.();
    if (!instance) return;

    const w = parseInt(width, 10);
    const h = parseInt(height, 10);
    const d = parseInt(dpi, 10);
    if (!w || !h || !d) return;

    setExporting(true);
    try {
      const pixelRatio = d / 96;

      const dataUrl = instance.getDataURL({
        type: "png",
        pixelRatio,
        backgroundColor: theme === "dark" ? "#1a1a2e" : "#ffffff",
      });

      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load chart image"));
      });

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, w, h);

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
      await invoke("export_image", { path: savePath, data: canvas.toDataURL("image/png") });

      onOpenChange(false);
    } catch (err) {
      console.error("PNG export failed:", err);
    } finally {
      setExporting(false);
    }
  }, [chartRef, width, height, dpi, theme, currentProject, onOpenChange]);

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
