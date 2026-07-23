import { useCallback, useState } from "react";
import type ReactECharts from "echarts-for-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/stores/projectStore";
import { resolveOption } from "@/lib/chart/resolveOption";
import {
  Image,
  FileCode,
  FileJson,
  FileText,
  Download,
  Copy,
  Check,
} from "lucide-react";
import { useT } from "@/lib/i18n/context";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chartRef: React.RefObject<ReactECharts | null>;
}

function triggerDownload(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function triggerBlobDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, filename);
  URL.revokeObjectURL(url);
}

export default function ExportDialog({
  open,
  onOpenChange,
  chartRef,
}: ExportDialogProps) {
  const currentProject = useProjectStore((s) => s.currentProject);
  const t = useT();
  const [copiedPng, setCopiedPng] = useState(false);

  const handleExportPng = useCallback(() => {
    const instance = chartRef.current?.getEchartsInstance?.();
    if (!instance) return;

    const dataUrl = instance.getDataURL({
      type: "png",
      pixelRatio: 2,
      backgroundColor: "#fff",
    });
    triggerDownload(dataUrl, "chart.png");
  }, [chartRef]);

  const handleCopyPng = useCallback(async () => {
    const instance = chartRef.current?.getEchartsInstance?.();
    if (!instance) return;

    const dataUrl = instance.getDataURL({
      type: "png",
      pixelRatio: 2,
      backgroundColor: "#fff",
    });

    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob }),
      ]);
      setCopiedPng(true);
      setTimeout(() => setCopiedPng(false), 2000);
    } catch {
      // fallback: open in new tab
      window.open(dataUrl, "_blank");
    }
  }, [chartRef]);

  const handleExportJson = useCallback(() => {
    if (!currentProject) return;
    const json = JSON.stringify(resolveOption(currentProject), null, 2);
    triggerBlobDownload(json, "chart-config.json", "application/json");
  }, [currentProject]);

  const handleExportHtml = useCallback(() => {
    if (!currentProject) return;
    const optionJson = JSON.stringify(resolveOption(currentProject), null, 2);

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${currentProject.metadata.name || "ECharts Chart"}</title>
  <script src="https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js"><\/script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; }
    #chart { width: 100%; height: 100vh; }
  </style>
</head>
<body>
  <div id="chart"></div>
  <script>
    var chart = echarts.init(document.getElementById('chart'));
    var option = ${optionJson};
    chart.setOption(option);
    window.addEventListener('resize', function() { chart.resize(); });
  <\/script>
</body>
</html>`;

    triggerBlobDownload(html, "chart.html", "text/html");
  }, [currentProject]);

  const handleExportProject = useCallback(() => {
    if (!currentProject) return;
    const json = JSON.stringify(currentProject, null, 2);
    const name = currentProject.metadata.name || "project";
    const safeName = name.replace(/[^a-zA-Z0-9-_]/g, "_").toLowerCase();
    triggerBlobDownload(json, `${safeName}.echarts.json`, "application/json");
  }, [currentProject]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t("export.title")}
          </DialogTitle>
          <DialogDescription>
            {t("export.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <ExportCard
            icon={<Image className="h-5 w-5" />}
            title={t("export.pngImage")}
            description={t("export.pngDescription")}
            actions={
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportPng}
                >
                  <Download className="mr-1 h-3.5 w-3.5" />
                  {t("export.download")}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyPng}
                >
                  {copiedPng ? (
                    <Check className="mr-1 h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="mr-1 h-3.5 w-3.5" />
                  )}
                  {copiedPng ? t("export.copied") : t("export.copy")}
                </Button>
              </div>
            }
          />

          <ExportCard
            icon={<Image className="h-5 w-5" />}
            title={t("export.svgImage")}
            description={t("export.svgDescription")}
            actions={
              <Button size="sm" variant="outline" disabled>
                {t("export.comingSoon")}
              </Button>
            }
          />

          <ExportCard
            icon={<FileJson className="h-5 w-5" />}
            title={t("export.jsonConfig")}
            description={t("export.jsonDescription")}
            actions={
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportJson}
                disabled={!currentProject}
              >
                <Download className="mr-1 h-3.5 w-3.5" />
                {t("export.download")}
              </Button>
            }
          />

          <ExportCard
            icon={<FileCode className="h-5 w-5" />}
            title={t("export.htmlStandalone")}
            description={t("export.htmlDescription")}
            actions={
              <Button
                size="sm"
                variant="outline"
                onClick={handleExportHtml}
                disabled={!currentProject}
              >
                <Download className="mr-1 h-3.5 w-3.5" />
                {t("export.download")}
              </Button>
            }
          />

          <div className="col-span-2">
            <ExportCard
              icon={<FileText className="h-5 w-5" />}
              title={t("export.projectFile")}
              description={t("export.projectDescription")}
              actions={
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportProject}
                  disabled={!currentProject}
                >
                  <Download className="mr-1 h-3.5 w-3.5" />
                  {t("export.download")}
                </Button>
              }
              fullWidth
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ExportCard({
  icon,
  title,
  description,
  actions,
  fullWidth,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  actions: React.ReactNode;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={`flex flex-col justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50 ${
        fullWidth ? "flex-row items-center gap-4" : ""
      }`}
    >
      <div className={fullWidth ? "flex items-center gap-3" : ""}>
        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium leading-tight">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className={fullWidth ? "shrink-0" : "mt-3"}>{actions}</div>
    </div>
  );
}
