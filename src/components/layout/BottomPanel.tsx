import { X, Code, Table, Terminal, Workflow, ChevronDown } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/uiStore";
import { useProjectStore } from "@/stores/projectStore";
import { useT } from "@/lib/i18n/context";
import JsonEditor from "@/components/json-editor/JsonEditor";
import DataEditor from "@/components/data/DataEditor";

export default function BottomPanel() {
  const t = useT();
  const bottomPanelOpen = useUIStore((s) => s.bottomPanelOpen);
  const bottomPanelTab = useUIStore((s) => s.bottomPanelTab);
  const toggleBottomPanel = useUIStore((s) => s.toggleBottomPanel);
  const setBottomPanelTab = useUIStore((s) => s.setBottomPanelTab);
  const currentProject = useProjectStore((s) => s.currentProject);

  const TABS = [
    { id: "json", label: t("bottomPanel.tabJson"), icon: Code },
    { id: "data", label: t("bottomPanel.tabData"), icon: Table },
    { id: "console", label: t("bottomPanel.tabConsole"), icon: Terminal },
    { id: "transforms", label: t("bottomPanel.tabTransforms"), icon: Workflow },
  ] as const;

  if (!bottomPanelOpen) return null;

  return (
    <Tabs
      value={bottomPanelTab}
      onValueChange={setBottomPanelTab}
      className="flex h-full flex-col"
    >
      <div className="flex items-center border-b bg-muted/30">
        <div className="flex items-center justify-center px-2">
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/50" />
        </div>

        <TabsList className="h-8 flex-1 rounded-none border-b border-transparent bg-transparent px-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="h-7 gap-1.5 px-2.5 text-xs data-[state=active]:bg-background data-[state=active]:shadow-none"
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="flex items-center pr-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={toggleBottomPanel}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <TabsContent value="json" className="m-0 flex-1 overflow-hidden">
        <JsonEditor />
      </TabsContent>

      <TabsContent value="data" className="m-0 flex-1 overflow-hidden">
        <DataEditor />
      </TabsContent>

      <TabsContent value="console" className="m-0 flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
            <Terminal className="h-8 w-8 opacity-40" />
            <p className="text-xs">
              {currentProject ? t("bottomPanel.noConsoleOutput") : t("bottomPanel.noProjectLoaded")}
            </p>
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="transforms" className="m-0 flex-1 overflow-hidden">
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
          <Workflow className="h-8 w-8 opacity-40" />
          <p className="text-sm font-medium">{t("bottomPanel.transformPipeline")}</p>
          <p className="text-xs text-muted-foreground/70">{t("bottomPanel.comingSoon")}</p>
        </div>
      </TabsContent>
    </Tabs>
  );
}
