import { useState, useCallback, useMemo } from "react";
import { useT } from "@/lib/i18n/context";
import {
  Search,
  Settings,
  Layers,
  Sliders,
  Palette,
  Type,
  Grid3X3,
  TrendingUp,
  RotateCcw,
} from "lucide-react";
import { useProjectStore } from "@/stores/projectStore";
import { useUIStore } from "@/stores/uiStore";
import { getOptionSchema, searchProperties } from "@/lib/schema/registry";
import type { PropertyCategory, PropertySchema } from "@/types/schema";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { PropertyField } from "@/components/inspector/PropertyField";
import { TreeView } from "@/components/inspector/TreeView";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  title: <Type className="h-4 w-4" />,
  tooltip: <Settings className="h-4 w-4" />,
  legend: <Layers className="h-4 w-4" />,
  grid: <Grid3X3 className="h-4 w-4" />,
  xAxis: <Sliders className="h-4 w-4" />,
  yAxis: <Sliders className="h-4 w-4" />,
  series: <TrendingUp className="h-4 w-4" />,
  color: <Palette className="h-4 w-4" />,
  animation: <Settings className="h-4 w-4" />,
  toolbox: <Settings className="h-4 w-4" />,
  dataZoom: <Sliders className="h-4 w-4" />,
  visualMap: <Palette className="h-4 w-4" />,
};

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".");
  const result = { ...obj };
  let current: Record<string, unknown> = result;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const nextPart = parts[i + 1];
    const isNextIndex = /^\d+$/.test(nextPart);

    if (Array.isArray(current[part])) {
      current[part] = [...(current[part] as unknown[])];
      current = current[part] as Record<string, unknown>;
    } else if (typeof current[part] === "object" && current[part] !== null) {
      current[part] = { ...(current[part] as Record<string, unknown>) };
      current = current[part] as Record<string, unknown>;
    } else {
      const newObj: Record<string, unknown> = isNextIndex ? ([] as unknown as Record<string, unknown>) : {};
      current[part] = newObj;
      current = newObj;
    }
  }

  const lastPart = parts[parts.length - 1];
  if (value === undefined) {
    if (Array.isArray(current)) {
      current.splice(Number(lastPart), 1);
    } else {
      const { [lastPart]: _, ...rest } = current;
      Object.assign(current, rest);
    }
  } else {
    if (Array.isArray(current)) {
      const idx = Number(lastPart);
      const newArr = [...current];
      newArr[idx] = value;
      current.length = 0;
      newArr.forEach((v) => current.push(v));
    } else {
      current[lastPart] = value;
    }
  }

  return result;
}

function PropertiesPanel({
  categories,
  option,
  onPropertyChange,
  searchQuery,
}: {
  categories: PropertyCategory[];
  option: Record<string, unknown>;
  onPropertyChange: (path: string, value: unknown) => void;
  searchQuery: string;
}) {
  const t = useT();
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return searchProperties(searchQuery, categories);
  }, [searchQuery, categories]);

  if (searchResults) {
    if (searchResults.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Search className="h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm">{t("inspector.noPropertiesFound")}</p>
          <p className="text-xs mt-1">{t("inspector.tryDifferentSearch")}</p>
        </div>
      );
    }

    return (
      <div className="space-y-1 px-2">
        <p className="text-xs text-muted-foreground py-2">
          {t("inspector.searchResultsCount", { count: searchResults.length })}
        </p>
        {searchResults.map((prop) => (
          <PropertyField
            key={prop.path}
            path={prop.path}
            schema={prop}
            value={getNestedValue(option, prop.path)}
            onChange={onPropertyChange}
          />
        ))}
      </div>
    );
  }

  return (
    <Accordion type="multiple" className="w-full">
      {categories.map((category) => (
        <AccordionItem key={category.id} value={category.id} className="border-b-0">
          <AccordionTrigger className="py-2 px-2 hover:no-underline text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">
                {CATEGORY_ICONS[category.id] ?? <Settings className="h-4 w-4" />}
              </span>
              <span>{category.label}</span>
              {category.description && (
                <span className="text-muted-foreground/60 font-normal normal-case text-[10px] hidden group-hover:inline">
                  {category.description}
                </span>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-2 pb-2">
            {category.properties.map((prop) => (
              <PropertyField
                key={prop.path}
                path={prop.path}
                schema={prop}
                value={getNestedValue(option, prop.path)}
                onChange={onPropertyChange}
              />
            ))}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

const EMPTY_OPTION: Record<string, unknown> = {};

export function PropertyInspector() {
  const t = useT();
  const currentProject = useProjectStore((s) => s.currentProject);
  const updateChartOption = useProjectStore((s) => s.updateChartOption);
  const inspectorTab = useUIStore((s) => s.inspectorTab);
  const setInspectorTab = useUIStore((s) => s.setInspectorTab);
  const selectedNodePath = useUIStore((s) => s.selectedNodePath);
  const setSelectedNodePath = useUIStore((s) => s.setSelectedNodePath);

  const option = (currentProject?.chart.option ?? EMPTY_OPTION) as Record<string, unknown>;

  const [searchQuery, setSearchQuery] = useState("");

  const categories = useMemo(() => getOptionSchema(), []);

  const handlePropertyChange = useCallback(
    (path: string, value: unknown) => {
      const updated = setNestedValue(option, path, value);
      updateChartOption(updated);
    },
    [option, updateChartOption]
  );

  const handleTreeViewSelect = useCallback(
    (path: string) => {
      setSelectedNodePath(path);
      setInspectorTab("properties");
      setSearchQuery(path.split(".").pop() ?? "");
    },
    [setSelectedNodePath, setInspectorTab]
  );

  const handleResetAll = useCallback(() => {
    const defaults: Record<string, unknown> = {};
    for (const cat of categories) {
      for (const prop of cat.properties) {
        if (prop.defaultValue !== undefined) {
          const updated = setNestedValue(defaults, prop.path, prop.defaultValue);
          Object.assign(defaults, updated);
        }
      }
    }
    updateChartOption(defaults);
  }, [categories, updateChartOption]);

  return (
    <div className="flex flex-col h-full">
      <div className="px-2 py-2 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            className="h-7 pl-8 text-xs"
            placeholder={t("inspector.searchPropertiesPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearchQuery("")}
              aria-label={t("inspector.clearSearch")}
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      <Tabs
        value={inspectorTab}
        onValueChange={setInspectorTab}
        className="flex-1 flex flex-col overflow-hidden"
      >
        <div className="px-2 pt-2">
          <TabsList className="w-full h-8">
            <TabsTrigger value="properties" className="text-xs flex-1">
              {t("inspector.tabProperties")}
            </TabsTrigger>
            <TabsTrigger value="structure" className="text-xs flex-1">
              {t("inspector.tabStructure")}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="properties" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full">
            <div className="p-2">
              {!searchQuery.trim() && (
                <div className="flex justify-end mb-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] text-muted-foreground"
                    onClick={handleResetAll}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    {t("inspector.resetAll")}
                  </Button>
                </div>
              )}
              <PropertiesPanel
                categories={categories}
                option={option}
                onPropertyChange={handlePropertyChange}
                searchQuery={searchQuery}
              />
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="structure" className="flex-1 overflow-hidden mt-0">
          <ScrollArea className="h-full">
            <div className="p-1">
              {Object.keys(option).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Layers className="h-8 w-8 mb-2 opacity-40" />
                  <p className="text-sm">{t("inspector.noOptionDefined")}</p>
                </div>
              ) : (
                <TreeView
                  data={option}
                  selectedPath={selectedNodePath}
                  onSelect={handleTreeViewSelect}
                />
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PropertyInspector;
