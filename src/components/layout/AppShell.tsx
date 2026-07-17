import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Toolbar } from "@/components/layout/Toolbar";
import { Sidebar } from "@/components/layout/Sidebar";
import PropertyInspector from "@/components/inspector/PropertyInspector";
import BottomPanel from "@/components/layout/BottomPanel";
import ChartPreview from "@/components/chart/ChartPreview";
import CommandPalette from "@/components/layout/CommandPalette";
import { useUIStore } from "@/stores/uiStore";
import { cn } from "@/lib/utils";

function HorizontalResizeHandle() {
  return (
    <PanelResizeHandle className="group relative w-1 bg-border transition-colors hover:bg-primary/50 cursor-col-resize">
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-transparent group-hover:bg-primary/30 transition-colors" />
    </PanelResizeHandle>
  );
}

export default function AppShell() {
  const theme = useUIStore((s) => s.theme);
  const bottomPanelOpen = useUIStore((s) => s.bottomPanelOpen);

  return (
    <div
      className={cn(
        "h-screen w-screen overflow-hidden flex flex-col bg-background text-foreground",
        theme === "dark" ? "dark" : "",
      )}
    >
      <Toolbar />

      <div className="flex-1 min-h-0">
        <PanelGroup direction="horizontal" className="h-full">
          <Panel id="sidebar" defaultSize={20} minSize={10} collapsedSize={0} collapsible>
            <Sidebar />
          </Panel>

          <HorizontalResizeHandle />

          <Panel id="center" defaultSize={55} minSize={30}>
            <div className="flex h-full flex-col">
              <div className={cn("min-h-0 p-2", bottomPanelOpen ? "flex-1" : "h-full")}>
                <ChartPreview />
              </div>

              {bottomPanelOpen && (
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
