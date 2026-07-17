import { useState, useCallback, useMemo } from "react";
import { useT } from "@/lib/i18n/context";
import {
  ChevronRight,
  ChevronDown,
  Braces,
  Hash,
  Type,
  ToggleLeft,
  Palette,
  Circle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TreeViewProps {
  data: Record<string, unknown>;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  level?: number;
}

type ValueType = "object" | "array" | "string" | "number" | "boolean" | "null" | "color";

function getValueType(value: unknown): ValueType {
  if (value === null || value === undefined) return "null";
  if (Array.isArray(value)) return "array";
  if (typeof value === "boolean") return "boolean";
  if (typeof value === "number") return "number";
  if (typeof value === "string") {
    if (/^#[0-9a-fA-F]{3,8}$/.test(value) || /^rgba?\(/.test(value) || /^hsla?\(/.test(value)) {
      return "color";
    }
    return "string";
  }
  if (typeof value === "object") return "object";
  return "string";
}

function getValuePreview(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (Array.isArray(value)) return `Array(${value.length})`;
  if (typeof value === "string") {
    if (value.length > 40) return `"${value.slice(0, 40)}..."`;
    return `"${value}"`;
  }
  if (typeof value === "object") return "{...}";
  return String(value);
}

function TypeIcon({ type }: { type: ValueType }) {
  const iconProps = { className: "h-3.5 w-3.5 shrink-0" };
  switch (type) {
    case "object":
      return <Braces {...iconProps} />;
    case "array":
      return <Braces {...iconProps} />;
    case "number":
      return <Hash {...iconProps} />;
    case "string":
      return <Type {...iconProps} />;
    case "boolean":
      return <ToggleLeft {...iconProps} />;
    case "color":
      return <Palette {...iconProps} />;
    case "null":
      return <Circle {...iconProps} />;
    default:
      return <Type {...iconProps} />;
  }
}

const TYPE_COLORS: Record<ValueType, string> = {
  object: "text-blue-400",
  array: "text-cyan-400",
  number: "text-green-400",
  string: "text-amber-400",
  boolean: "text-purple-400",
  color: "text-pink-400",
  null: "text-muted-foreground",
};

interface TreeNodeProps {
  keyName: string;
  value: unknown;
  parentPath: string;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  level: number;
  isArrayElement?: boolean;
  arrayIndex?: number;
  t: (key: string, params?: Record<string, string | number>) => string;
}

function TreeNode({
  keyName,
  value,
  parentPath,
  selectedPath,
  onSelect,
  level,
  isArrayElement = false,
  arrayIndex,
  t,
}: TreeNodeProps) {
  const fullPath = parentPath ? `${parentPath}.${keyName}` : keyName;
  const type = getValueType(value);
  const isExpandable = type === "object" || type === "array";
  const isSelected = selectedPath === fullPath;

  const [expanded, setExpanded] = useState(level < 1);

  const toggleExpand = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const handleClick = useCallback(() => {
    if (isExpandable) {
      toggleExpand();
    } else {
      onSelect(fullPath);
    }
  }, [isExpandable, toggleExpand, onSelect, fullPath]);

  const entries = useMemo(() => {
    if (!isExpandable || value == null) return [];
    if (Array.isArray(value)) {
      return value.map((item, i) => ({
        key: String(i),
        value: item,
        isArray: true,
        index: i,
      }));
    }
    if (typeof value === "object") {
      return Object.entries(value as Record<string, unknown>).map(([k, v]) => ({
        key: k,
        value: v,
        isArray: false,
        index: undefined,
      }));
    }
    return [];
  }, [value, isExpandable]);

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1.5 py-0.5 px-1 rounded-sm cursor-pointer text-xs select-none group transition-colors",
          isSelected
            ? "bg-primary/15 text-primary"
            : "hover:bg-muted/50 text-foreground/80"
        )}
        style={{ paddingLeft: `${level * 16 + 4}px` }}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        role="treeitem"
        aria-selected={isSelected}
        aria-expanded={isExpandable ? expanded : undefined}
        tabIndex={0}
      >
        {isExpandable ? (
          <button
            className="flex items-center justify-center h-4 w-4 shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand();
            }}
            aria-label={expanded ? t("treeView.collapse") : t("treeView.expand")}
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="h-4 w-4 shrink-0" />
        )}

        <span className={cn("shrink-0", TYPE_COLORS[type])}>
          <TypeIcon type={type} />
        </span>

        <span className="font-medium truncate">
          {isArrayElement && arrayIndex !== undefined ? arrayIndex : keyName}
        </span>

        {!isExpandable && (
          <span className="text-muted-foreground truncate ml-1 opacity-70">
            {type === "color" ? (
              <span className="inline-flex items-center gap-1">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full border border-border"
                  style={{ backgroundColor: String(value) }}
                />
                {getValuePreview(value)}
              </span>
            ) : (
              getValuePreview(value)
            )}
          </span>
        )}

        {isExpandable && (
          <span className="text-muted-foreground/50 text-[10px] ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
            {type === "array" ? `${(value as unknown[]).length} ${t("treeView.itemsCount")}` : `${entries.length} ${t("treeView.keysCount")}`}
          </span>
        )}
      </div>

      {isExpandable && expanded && (
        <div role="group">
          {entries.map((entry) => (
            <TreeNode
              key={entry.key}
              keyName={entry.key}
              value={entry.value}
              parentPath={fullPath}
              selectedPath={selectedPath}
              onSelect={onSelect}
              level={level + 1}
              isArrayElement={entry.isArray}
              arrayIndex={entry.index}
              t={t}
            />
          ))}
          {entries.length === 0 && (
            <div
              className="text-[10px] text-muted-foreground/50 py-0.5"
              style={{ paddingLeft: `${(level + 1) * 16 + 4}px` }}
            >
              {type === "array" ? t("treeView.emptyArray") : t("treeView.emptyObject")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TreeView({ data, selectedPath, onSelect, level = 0 }: TreeViewProps) {
  const t = useT();
  return (
    <div className="py-1" role="tree" aria-label="Option structure tree">
      {Object.entries(data).map(([key, value]) => (
        <TreeNode
          key={key}
          keyName={key}
          value={value}
          parentPath=""
          selectedPath={selectedPath}
          onSelect={onSelect}
          level={level}
          t={t}
        />
      ))}
    </div>
  );
}

export default TreeView;
