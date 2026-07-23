import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels";
import { BarChart3, Table } from "lucide-react";
import { Toolbar } from "@/components/layout/Toolbar";
import { Sidebar } from "@/components/layout/Sidebar";
import PropertyInspector from "@/components/inspector/PropertyInspector";
import BottomPanel from "@/components/layout/BottomPanel";
import ChartPreview from "@/components/chart/ChartPreview";
import DataEditor from "@/components/data/DataEditor";
import CommandPalette from "@/components/layout/CommandPalette";
import { useUIStore } from "@/stores/uiStore";
import { useT } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

function HorizontalResizeHandle() {
  return (
    <PanelResizeHandle className="group relative w-1 bg-border transition-colors hover:bg-primary/50 cursor-col-resize">
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-transparent group-hover:bg-primary/30 transition-colors" />
    </PanelResizeHandle>
  );
}

export default function AppShell() {
  const t = useT();
  const theme = useUIStore((s) => s.theme);
  const centerView = useUIStore((s) => s.centerView);
  const setCenterView = useUIStore((s) => s.setCenterView);
  const bottomPanelOpen = useUIStore((s) => s.bottomPanelOpen);

  const showBottomPanel = bottomPanelOpen && centerView === "chart";

  return (
    <div
      className={cn(
        "h-screen w-screen overflow-hidden flex flex-col bg-background text-foreground",
        theme === "dark" ? "dark" : "",
      )}
    >
      <Toolbar />

      <div className="flex-1 min-h-0">
        <PanelGroup orientation="horizontal" className="h-full">
          <Panel id="sidebar" defaultSize={20} minSize={10} collapsedSize={0} collapsible>
            <Sidebar />
          </Panel>

          <HorizontalResizeHandle />

          <Panel id="center" defaultSize={55} minSize={30}>
            <div className="flex h-full flex-col">
              {/* Center view tabs */}
              <div className="flex items-center gap-1 border-b bg-muted/30 px-2 py-1">
                <button
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    centerView === "chart"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => setCenterView("chart")}
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  {t("sidebar.tabTemplates")}
                </button>
                <button
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                    centerView === "data"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => setCenterView("data")}
                >
                  <Table className="h-3.5 w-3.5" />
                  {t("sidebar.tabData")}
                </button>
              </div>

              {/* Center content */}
              {centerView === "chart" ? (
                <div className={cn("min-h-0 p-2", showBottomPanel ? "flex-1" : "h-full")}>
                  <ChartPreview />
                </div>
              ) : (
                <div className="min-h-0 flex-1">
                  <DataEditor />
                </div>
              )}

              {/* Bottom panel (only in chart view) */}
              {showBottomPanel && (
                <div className="h-[250px] min-h-[100px] border-t border-border">
                  <BottomPanel />
                </div>
              )}
            </div>
          </Panel>

          <HorizontalResizeHandle />

          <Panel id="inspector" defaultSize={25} minSize={15} collapsedSize={0} collapsible>
            <div className="h-full border-l border-border">
              <PropertyInspector />
            </div>
          </Panel>
        </PanelGroup>
      </div>

      <CommandPalette />
    </div>
  );
}
