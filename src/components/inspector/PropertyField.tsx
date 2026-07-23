import { useCallback, useMemo } from "react";
import { RotateCcw, HelpCircle } from "lucide-react";
import type { PropertySchema } from "@/types/schema";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface PropertyFieldProps {
  path: string;
  schema: PropertySchema;
  value: unknown;
  onChange: (path: string, value: unknown) => void;
  /** Restore the generated value by removing the override at this path. */
  onReset?: (path: string) => void;
}

function getValueAtPath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function serializeJsonValue(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return JSON.stringify(value, null, 2);
    }
  }
  return JSON.stringify(value, null, 2);
}

export function PropertyField({ path, schema, value, onChange, onReset }: PropertyFieldProps) {
  const effectiveValue = value !== undefined ? value : schema.defaultValue;
  const hasChanged = value !== undefined && value !== schema.defaultValue;

  const handleReset = useCallback(() => {
    if (onReset) onReset(path);
    else onChange(path, schema.defaultValue);
  }, [path, schema.defaultValue, onChange, onReset]);

  const fieldId = useMemo(() => `prop-${path.replace(/[\[\].]/g, "-")}`, [path]);

  const label = (
    <div className="flex items-center gap-1.5">
      <Label htmlFor={fieldId} className="text-xs font-medium cursor-pointer select-none">
        {schema.label}
      </Label>
      {schema.description && (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help shrink-0" />
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[240px] text-xs">
              {schema.description}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );

  const resetButton = hasChanged ? (
    <Button
      variant="ghost"
      size="icon"
      className="h-5 w-5 shrink-0"
      onClick={handleReset}
      aria-label={`Reset ${schema.label} to default`}
    >
      <RotateCcw className="h-3 w-3 text-muted-foreground" />
    </Button>
  ) : null;

  const renderControl = () => {
    switch (schema.inputType) {
      case "string":
      case "function": {
        const strValue = effectiveValue != null ? String(effectiveValue) : "";
        return (
          <Input
            id={fieldId}
            className="h-7 text-xs"
            value={strValue}
            placeholder={schema.inputType === "function" ? "() => value" : ""}
            onChange={(e) => onChange(path, e.target.value)}
          />
        );
      }

      case "number": {
        const numValue =
          typeof effectiveValue === "number" ? effectiveValue : Number(effectiveValue) || 0;
        return (
          <Input
            id={fieldId}
            type="number"
            className="h-7 text-xs"
            value={numValue}
            min={schema.min}
            max={schema.max}
            step={schema.step}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v)) onChange(path, v);
            }}
          />
        );
      }

      case "boolean": {
        return (
          <div className="flex items-center justify-between">
            <Switch
              id={fieldId}
              checked={!!effectiveValue}
              onCheckedChange={(checked) => onChange(path, checked)}
            />
          </div>
        );
      }

      case "color": {
        const colorStr = effectiveValue != null ? String(effectiveValue) : "#000000";
        return (
          <div className="flex items-center gap-2">
            <div className="relative">
              <input
                id={fieldId}
                type="color"
                className="h-7 w-9 cursor-pointer rounded border border-input p-0.5"
                value={colorStr.startsWith("#") ? colorStr : "#000000"}
                onChange={(e) => onChange(path, e.target.value)}
              />
            </div>
            <Input
              className="h-7 text-xs font-mono flex-1"
              value={colorStr}
              onChange={(e) => onChange(path, e.target.value)}
            />
          </div>
        );
      }

      case "enum": {
        const strValue = effectiveValue != null ? String(effectiveValue) : "";
        return (
          <Select value={strValue} onValueChange={(v) => onChange(path, v)}>
            <SelectTrigger id={fieldId} className="h-7 text-xs">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {(schema.enumValues ?? []).map((opt) => (
                <SelectItem key={opt} value={opt} className="text-xs">
                  {opt || "(empty)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }

      case "slider": {
        const numValue =
          typeof effectiveValue === "number" ? effectiveValue : Number(effectiveValue) || 0;
        return (
          <div className="flex items-center gap-2">
            <Slider
              id={fieldId}
              className="flex-1"
              min={schema.min ?? 0}
              max={schema.max ?? 100}
              step={schema.step ?? 1}
              value={[numValue]}
              onValueChange={([v]) => onChange(path, v)}
            />
            <span className="min-w-[2.5rem] text-right text-xs tabular-nums text-muted-foreground">
              {typeof numValue === "number" ? (Number.isInteger(numValue) ? numValue : numValue.toFixed(2)) : numValue}
            </span>
          </div>
        );
      }

      case "array":
      case "colorArray": {
        const jsonStr = serializeJsonValue(effectiveValue);
        return (
          <Textarea
            id={fieldId}
            className="min-h-[60px] text-xs font-mono resize-y"
            value={jsonStr}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                onChange(path, parsed);
              } catch {
                onChange(path, e.target.value);
              }
            }}
          />
        );
      }

      case "object": {
        const jsonStr = serializeJsonValue(effectiveValue);
        return (
          <Textarea
            id={fieldId}
            className="min-h-[80px] text-xs font-mono resize-y"
            value={jsonStr}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                onChange(path, parsed);
              } catch {
                onChange(path, e.target.value);
              }
            }}
          />
        );
      }

      case "json": {
        const jsonStr = serializeJsonValue(effectiveValue);
        return (
          <Textarea
            id={fieldId}
            className="min-h-[80px] text-xs font-mono resize-y"
            value={jsonStr}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                onChange(path, parsed);
              } catch {
                onChange(path, e.target.value);
              }
            }}
          />
        );
      }

      default: {
        const strValue = effectiveValue != null ? String(effectiveValue) : "";
        return (
          <Input
            id={fieldId}
            className="h-7 text-xs"
            value={strValue}
            onChange={(e) => onChange(path, e.target.value)}
          />
        );
      }
    }
  };

  if (schema.inputType === "boolean") {
    return (
      <div className="flex items-center justify-between py-1.5">
        <div className="flex items-center gap-1.5">
          <Label htmlFor={fieldId} className="text-xs font-medium cursor-pointer select-none">
            {schema.label}
          </Label>
          {schema.description && (
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3 w-3 text-muted-foreground/60 cursor-help shrink-0" />
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-[240px] text-xs">
                  {schema.description}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {resetButton}
          {renderControl()}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 py-1.5">
      <div className="flex items-center justify-between">
        {label}
        {resetButton}
      </div>
      {renderControl()}
    </div>
  );
}

export default PropertyField;
