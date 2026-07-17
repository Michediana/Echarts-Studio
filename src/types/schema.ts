export type PropertyInputType =
  | "string"
  | "number"
  | "boolean"
  | "color"
  | "enum"
  | "array"
  | "object"
  | "slider"
  | "select"
  | "colorArray"
  | "richText"
  | "function"
  | "json";

export interface PropertySchema {
  path: string;
  key: string;
  label: string;
  description?: string;
  category: string;
  inputType: PropertyInputType;
  defaultValue?: unknown;
  currentValue?: unknown;
  enumValues?: string[];
  min?: number;
  max?: number;
  step?: number;
  required?: boolean;
  children?: PropertySchema[];
  visible?: (parentValues: Record<string, unknown>) => boolean;
  examples?: unknown[];
  since?: string;
  deprecated?: boolean;
}

export interface PropertyCategory {
  id: string;
  label: string;
  icon?: string;
  description?: string;
  properties: PropertySchema[];
  subcategories?: PropertyCategory[];
}

export interface OptionSchema {
  categories: PropertyCategory[];
  flatProperties: Map<string, PropertySchema>;
}
