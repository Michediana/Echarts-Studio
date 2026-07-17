export function getDefaultOption(): Record<string, unknown> {
  return {
    title: {
      text: "",
      subtext: "",
      left: "center",
      top: "auto",
      textStyle: {
        color: "#333",
        fontSize: 18,
        fontWeight: "bold",
      },
    },
    tooltip: {
      show: true,
      trigger: "item",
      backgroundColor: "rgba(50,50,50,0.9)",
      borderColor: "#333",
      borderWidth: 0,
      textStyle: {
        color: "#fff",
        fontSize: 14,
      },
    },
    legend: {
      show: true,
      type: "scroll",
      orient: "horizontal",
      left: "center",
      top: "auto",
      textStyle: {
        color: "#333",
        fontSize: 12,
      },
    },
    grid: {
      left: "10%",
      right: "10%",
      top: "10%",
      bottom: "10%",
      containLabel: false,
    },
    xAxis: {
      type: "category",
      data: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      position: "bottom",
      axisLabel: {
        show: true,
        color: "#666",
        fontSize: 12,
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: "#333",
        },
      },
      splitLine: {
        show: false,
      },
    },
    yAxis: {
      type: "value",
      axisLabel: {
        show: true,
        color: "#666",
        fontSize: 12,
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: "#333",
        },
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: "#E5E5E5",
          type: "solid",
        },
      },
    },
    series: [
      {
        type: "bar",
        name: "Sales",
        data: [120, 200, 150, 80, 70, 110, 130],
        itemStyle: {
          color: "#5470c6",
        },
        label: {
          show: false,
          position: "top",
        },
      },
    ],
    color: [
      "#5470c6",
      "#91cc75",
      "#fac858",
      "#ee6666",
      "#73c0de",
      "#3ba272",
      "#fc8452",
      "#9a60b4",
      "#ea7ccc",
    ],
    animation: true,
    animationDuration: 1000,
    animationEasing: "cubicOut",
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function mergeDefaults(
  option: Record<string, unknown>,
  defaults: Record<string, unknown> = getDefaultOption()
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  const allKeys = new Set([...Object.keys(defaults), ...Object.keys(option)]);

  for (const key of allKeys) {
    const defaultVal = defaults[key];
    const optionVal = option[key];

    if (optionVal === undefined) {
      result[key] = defaultVal;
    } else if (isPlainObject(optionVal) && isPlainObject(defaultVal)) {
      result[key] = mergeDefaults(
        optionVal as Record<string, unknown>,
        defaultVal as Record<string, unknown>
      );
    } else {
      result[key] = optionVal;
    }
  }

  return result;
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    if (typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): void {
  const parts = path.split(".");
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (current[part] === undefined || current[part] === null) {
      current[part] = {};
    }
    if (typeof current[part] !== "object" || current[part] === null) return;
    current = current[part] as Record<string, unknown>;
  }

  current[parts[parts.length - 1]] = value;
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a !== "object") return false;

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  const keysA = Object.keys(a as Record<string, unknown>);
  const keysB = Object.keys(b as Record<string, unknown>);
  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (
      !deepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )
    ) {
      return false;
    }
  }

  return true;
}

function collectLeafPaths(
  obj: Record<string, unknown>,
  prefix: string = ""
): string[] {
  const paths: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const currentPath = prefix ? `${prefix}.${key}` : key;

    if (isPlainObject(value)) {
      paths.push(...collectLeafPaths(value as Record<string, unknown>, currentPath));
    } else {
      paths.push(currentPath);
    }
  }

  return paths;
}

export function getOptionDiff(
  current: Record<string, unknown>,
  defaults: Record<string, unknown> = getDefaultOption()
): Record<string, unknown> {
  const diffs: Record<string, unknown> = {};
  const currentPaths = new Set(collectLeafPaths(current));
  const defaultPaths = new Set(collectLeafPaths(defaults));

  for (const path of currentPaths) {
    const currentVal = getNestedValue(current, path);
    const defaultVal = getNestedValue(defaults, path);

    if (!deepEqual(currentVal, defaultVal)) {
      setNestedValue(diffs, path, currentVal);
    }
  }

  for (const path of defaultPaths) {
    if (!currentPaths.has(path)) {
      const defaultVal = getNestedValue(defaults, path);
      setNestedValue(diffs, path, defaultVal);
    }
  }

  return diffs;
}
