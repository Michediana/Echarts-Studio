import { useState, useCallback } from "react";
import {
  FolderTree,
  Database,
  LayoutTemplate,
  Plus,
  Upload,
  Tag,
  Clock,
  FileText,
  BarChart3,
  LineChart,
  PieChart,
  ScatterChart,
  Activity,
  X,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useProjectStore } from "@/stores/projectStore";
import { useUIStore } from "@/stores/uiStore";
import { useT } from "@/lib/i18n/context";
import { chartTemplates, type ChartTemplate } from "@/templates/index";
import type { DatasetDocument, ProjectDocument } from "@/types/project";

const TEMPLATE_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  BarChart3,
  TrendingUp: LineChart,
  PieChart,
  ScatterChart,
  AreaChart: Activity,
  Grid3x3: Activity,
  Gauge: Activity,
  CandlestickChart: LineChart,
  Filter: Activity,
  Radar: Activity,
};

const CATEGORY_COLORS: Record<ChartTemplate["category"], string> = {
  basic: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  timeseries: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
  comparison: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
  distribution: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  advanced: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

function TemplateIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = TEMPLATE_ICON_MAP[icon] ?? BarChart3;
  return <Icon className={className} />;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Sidebar() {
  const t = useT();
  const currentProject = useProjectStore((s) => s.currentProject);
  const updateMetadata = useProjectStore((s) => s.updateMetadata);
  const addDataset = useProjectStore((s) => s.addDataset);
  const applyTemplate = useProjectStore((s) => s.applyTemplate);

  const isDefault = currentProject?.metadata?.isDefault ?? false;
  const showTemplates = isDefault;
  const [activeTab, setActiveTab] = useState<string>("project");

  if (activeTab === "templates" && !showTemplates) {
    setActiveTab("project");
  }

  return (
    <div className="flex h-full flex-col bg-sidebar-background">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex h-full flex-col">
        <TabsList className="mx-2 mt-2 h-8">
          <TabsTrigger value="project" className="gap-1.5 text-xs px-2 h-6">
            <FolderTree className="h-3.5 w-3.5" />
            {t("sidebar.tabProject")}
          </TabsTrigger>
          <TabsTrigger value="data" className="gap-1.5 text-xs px-2 h-6">
            <Database className="h-3.5 w-3.5" />
            {t("sidebar.tabData")}
          </TabsTrigger>
          {showTemplates && (
            <TabsTrigger value="templates" className="gap-1.5 text-xs px-2 h-6">
              <LayoutTemplate className="h-3.5 w-3.5" />
              {t("sidebar.tabTemplates")}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="project" className="flex-1 mt-0 overflow-hidden">
          <ScrollArea className="h-full">
            <ProjectTab
              project={currentProject}
              onUpdateMetadata={updateMetadata}
            />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="data" className="flex-1 mt-0 overflow-hidden">
          <ScrollArea className="h-full">
            <DataTab
              datasets={currentProject?.datasets ?? []}
              onAddDataset={addDataset}
            />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="templates" className="flex-1 mt-0 overflow-hidden">
          <ScrollArea className="h-full">
            <TemplatesTab onApplyTemplate={applyTemplate} />
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                Project Tab                                 */
/* -------------------------------------------------------------------------- */

interface ProjectTabProps {
  project: ProjectDocument | null;
  onUpdateMetadata: (metadata: Partial<ProjectDocument["metadata"]>) => void;
}

function ProjectTab({ project, onUpdateMetadata }: ProjectTabProps) {
  const t = useT();
  const [newTag, setNewTag] = useState("");

  const handleAddTag = useCallback(() => {
    const tag = newTag.trim();
    if (!tag || !project) return;
    if (project.metadata.tags.includes(tag)) {
      setNewTag("");
      return;
    }
    onUpdateMetadata({ tags: [...project.metadata.tags, tag] });
    setNewTag("");
  }, [newTag, project, onUpdateMetadata]);

  const handleRemoveTag = useCallback(
    (tag: string) => {
      if (!project) return;
      onUpdateMetadata({ tags: project.metadata.tags.filter((t: string) => t !== tag) });
    },
    [project, onUpdateMetadata],
  );

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center">
        <FileText className="mb-3 h-8 w-8 text-muted-foreground/50" />
        <p className="text-sm text-muted-foreground">
          {t("sidebar.noProject")}
          <br />
          {t("sidebar.noProjectHint")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-3">
      {/* Project Name */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">{t("sidebar.name")}</label>
        <Input
          value={project.metadata.name}
          onChange={(e) => onUpdateMetadata({ name: e.target.value })}
          className="h-8 text-sm"
          placeholder={t("sidebar.projectNamePlaceholder")}
        />
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          {t("sidebar.description")}
        </label>
        <Textarea
          value={project.metadata.description ?? ""}
          onChange={(e) => onUpdateMetadata({ description: e.target.value })}
          className="min-h-[60px] resize-none text-sm"
          placeholder={t("sidebar.descriptionPlaceholder")}
        />
      </div>

      {/* Tags */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          <Tag className="mr-1 inline h-3 w-3" />
          {t("sidebar.tags")}
        </label>
        <div className="flex flex-wrap gap-1.5">
          {project.metadata.tags.map((tag: string) => (
            <Badge key={tag} variant="secondary" className="gap-1 text-xs">
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                aria-label={`${t("sidebar.removeTag")} ${tag}`}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-1">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddTag();
              }
            }}
            className="h-7 text-xs"
            placeholder={t("sidebar.addTagPlaceholder")}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2"
            onClick={handleAddTag}
            disabled={!newTag.trim()}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      <Separator />

      {/* Dates */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{t("sidebar.created")} {formatDate(project.metadata.createdAt)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{t("sidebar.updated")} {formatDate(project.metadata.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Data Tab                                   */
/* -------------------------------------------------------------------------- */

interface DataTabProps {
  datasets: DatasetDocument[];
  onAddDataset: (dataset: DatasetDocument) => void;
}

function DataTab({ datasets, onAddDataset }: DataTabProps) {
  const t = useT();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const setCenterView = useUIStore((s) => s.setCenterView);

  const openDataPanel = useCallback(() => {
    setCenterView("data");
  }, [setCenterView]);

  const handleAddBlank = useCallback(() => {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const dataset: DatasetDocument = {
      id,
      name: `Dataset ${datasets.length + 1}`,
      columns: [
        { id: crypto.randomUUID(), name: "column_a", type: "string" },
        { id: crypto.randomUUID(), name: "column_b", type: "number" },
      ],
      rows: [],
      createdAt: now,
      updatedAt: now,
    };
    onAddDataset(dataset);
    openDataPanel();
  }, [datasets.length, onAddDataset, openDataPanel]);

  const handleImport = useCallback(
    async (accept: string) => {
      try {
        const { open } = await import("@tauri-apps/plugin-dialog");
        const extensions = accept.split(",").map((s) => s.trim().replace(".", ""));
        const path = await open({
          filters: [{ name: "Data files", extensions }],
          multiple: false,
        });
        if (!path) return;
        const content = await import("@tauri-apps/api/core").then((m) =>
          m.invoke<string>("read_project", { path: path as string }),
        );
        const parsed = JSON.parse(content) as DatasetDocument;
        onAddDataset(parsed);
        openDataPanel();
      } catch (err) {
        console.error("Failed to import dataset:", err);
      }
    },
    [onAddDataset, openDataPanel],
  );

  return (
    <div className="space-y-3 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {t("sidebar.datasetsCount")} ({datasets.length})
        </span>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={handleAddBlank}
          >
            <Plus className="h-3 w-3" />
            {t("sidebar.new")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1 px-2 text-xs"
            onClick={() => handleImport(".csv,.json")}
          >
            <Upload className="h-3 w-3" />
            {t("sidebar.import")}
          </Button>
        </div>
      </div>

      {datasets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Database className="mb-2 h-7 w-7 text-muted-foreground/50" />
          <p className="text-xs text-muted-foreground">
            {t("sidebar.noDatasets")}
            <br />
            {t("sidebar.noDatasetsHint")}
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {datasets.map((ds) => (
            <Card
              key={ds.id}
              className={`cursor-pointer transition-colors hover:bg-accent ${
                selectedId === ds.id ? "border-primary bg-accent" : ""
              }`}
              onClick={() => {
                const next = ds.id === selectedId ? null : ds.id;
                setSelectedId(next);
                if (next) openDataPanel();
              }}
            >
              <CardContent className="flex items-center gap-3 p-2.5">
                <Database className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{ds.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {t("sidebar.rowsColumns", { rows: ds.rows.length, cols: ds.columns.length })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Templates Tab                                */
/* -------------------------------------------------------------------------- */

interface TemplatesTabProps {
  onApplyTemplate: (option: Record<string, unknown>) => void;
}

function TemplatesTab({ onApplyTemplate }: TemplatesTabProps) {
  const t = useT();
  const handleApply = useCallback(
    (template: ChartTemplate) => {
      onApplyTemplate(template.option);
    },
    [onApplyTemplate],
  );

  return (
    <div className="space-y-3 p-3">
      <span className="text-xs font-medium text-muted-foreground">
        {t("sidebar.chartTemplatesCount")} ({chartTemplates.length})
      </span>

      <div className="grid grid-cols-1 gap-2">
        {chartTemplates.map((template) => (
          <Card
            key={template.id}
            className="cursor-pointer transition-colors hover:bg-accent hover:shadow-md"
            onClick={() => handleApply(template)}
          >
            <CardContent className="flex items-start gap-2.5 p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                <TemplateIcon
                  icon={template.icon}
                  className="h-4 w-4 text-muted-foreground"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-xs font-medium">{template.name}</p>
                </div>
                <Badge
                  variant="secondary"
                  className={`mt-1 text-[10px] px-1.5 py-0 ${CATEGORY_COLORS[template.category]}`}
                >
                  {template.category}
                </Badge>
                <p className="mt-1 text-[11px] leading-snug text-muted-foreground line-clamp-2">
                  {template.description}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
