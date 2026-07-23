import { useMemo, useCallback, useState, useRef, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { json, jsonParseLinter } from "@codemirror/lang-json";
import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { Toaster, toast } from "sonner";
import { useProjectStore } from "@/stores/projectStore";
import { useUIStore } from "@/stores/uiStore";
import { resolveOption, resolveBaseOption } from "@/lib/chart/resolveOption";
import { computeOverrides } from "@/lib/chart/computeOverrides";
import { isPlainObject } from "@/lib/chart/deepEqual";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Copy,
  Braces,
  Hash,
  AlertCircle,
  FileCode,
  Link2,
} from "lucide-react";
import { useT } from "@/lib/i18n/context";

interface Diagnostic {
  message: string;
  from: number;
  line: number;
  col: number;
}

function debounce<F extends (value: string) => void>(fn: F, ms: number): F & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout>;
  const debounced = (value: string) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(value), ms);
  };
  (debounced as F & { cancel: () => void }).cancel = () => clearTimeout(timer);
  return debounced as F & { cancel: () => void };
}

/**
 * Real JSON diagnostics from CodeMirror's `jsonParseLinter`, mapped to
 * line/column so the bottom panel can jump to the offending position.
 */
function computeDiagnostics(value: string): Diagnostic[] {
  try {
    JSON.parse(value);
    return [];
  } catch {
    const state = EditorState.create({ doc: value });
    const results = jsonParseLinter()({ state } as unknown as EditorView);
    return results.map((d) => {
      const line = state.doc.lineAt(d.from);
      return {
        message: d.message,
        from: d.from,
        line: line.number,
        col: d.from - line.from + 1,
      };
    });
  }
}

export default function JsonEditor() {
  const t = useT();
  const currentProject = useProjectStore((s) => s.currentProject);
  const setOptionOverrides = useProjectStore((s) => s.setOptionOverrides);
  const theme = useUIStore((s) => s.theme);

  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([]);
  const [detached, setDetached] = useState(false);
  const [localValue, setLocalValue] = useState("");

  const viewRef = useRef<EditorView | null>(null);
  const isEditingRef = useRef(false);
  const warnedRef = useRef(false);

  // The resolved option (base + overrides) is the source the editor mirrors.
  const resolvedJson = useMemo(
    () => (currentProject ? JSON.stringify(resolveOption(currentProject), null, 2) : ""),
    [currentProject],
  );
  const resolvedJsonRef = useRef(resolvedJson);
  resolvedJsonRef.current = resolvedJson;

  // Reflect external changes (undo/redo, inspector edits, templates) into the
  // buffer — but never clobber what the user is actively typing.
  useEffect(() => {
    if (isEditingRef.current) return;
    setLocalValue(resolvedJson);
    setDiagnostics([]);
  }, [resolvedJson]);

  const applyRef = useRef<(value: string) => void>(() => {});
  applyRef.current = (value: string) => {
    const project = useProjectStore.getState().currentProject;
    if (!project) return;

    const diags = computeDiagnostics(value);
    setDiagnostics(diags);
    if (diags.length > 0) return;

    const parsed: unknown = JSON.parse(value);
    if (!isPlainObject(parsed)) {
      setDiagnostics([{ message: t("jsonEditor.rootMustBeObject"), from: 0, line: 1, col: 1 }]);
      return;
    }

    const base = resolveBaseOption(project);
    const diff = computeOverrides(base, parsed);
    if (diff !== null) {
      // Clean diff against the generated base → dataset link preserved.
      setOptionOverrides(diff, "json");
      setDetached(false);
    } else {
      // The edit can't be expressed as a diff of the base — store it wholesale
      // and warn the user (non-blocking) that the chart is now detached.
      setOptionOverrides(parsed, "json");
      setDetached(true);
      if (project.chart.binding && !warnedRef.current) {
        warnedRef.current = true;
        toast.warning(t("jsonEditor.detachedWarning"));
      }
    }
  };

  const debouncedUpdate = useRef(debounce((value: string) => applyRef.current(value), 400));

  useEffect(() => {
    return () => debouncedUpdate.current.cancel();
  }, []);

  const onChange = useCallback((value: string) => {
    setLocalValue(value);
    debouncedUpdate.current(value);
  }, []);

  const reattach = useCallback(() => {
    warnedRef.current = false;
    setDetached(false);
    setOptionOverrides({});
    toast.success(t("jsonEditor.reattached"));
  }, [setOptionOverrides, t]);

  const goToDiagnostic = useCallback((d: Diagnostic) => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({ selection: { anchor: d.from }, scrollIntoView: true });
    view.focus();
  }, []);

  const focusHandlers = useMemo(
    () =>
      EditorView.domEventHandlers({
        focus: () => {
          isEditingRef.current = true;
          return false;
        },
        blur: () => {
          isEditingRef.current = false;
          // Reconcile formatting with the canonical resolved option on blur.
          setLocalValue(resolvedJsonRef.current);
          return false;
        },
      }),
    [],
  );

  const darkTheme = useMemo(
    () =>
      EditorView.theme({
        "&": {
          backgroundColor: "hsl(240, 10%, 3.9%)",
          color: "hsl(0, 0%, 98%)",
        },
        ".cm-gutters": {
          backgroundColor: "hsl(240, 10%, 3.9%)",
          color: "hsl(240, 3.8%, 46.1%)",
          borderRight: "1px solid hsl(240, 3.7%, 15.9%)",
        },
        ".cm-activeLineGutter": {
          backgroundColor: "hsl(240, 3.7%, 15.9%)",
        },
        ".cm-activeLine": {
          backgroundColor: "hsl(240, 3.7%, 15.9%, 0.5)",
        },
        ".cm-cursor, .cm-dropCursor": {
          borderLeftColor: "hsl(0, 0%, 98%)",
        },
        ".cm-selectionBackground": {
          backgroundColor: "hsl(217, 33%, 17%) !important",
        },
        "&.cm-focused .cm-selectionBackground": {
          backgroundColor: "hsl(217, 33%, 17%) !important",
        },
        ".cm-matchingBracket": {
          backgroundColor: "hsl(217, 33%, 17%)",
          outline: "1px solid hsl(217, 33%, 30%)",
        },
        ".cm-content": {
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontSize: "13px",
          lineHeight: "1.6",
        },
      }),
    [],
  );

  const lightTheme = useMemo(
    () =>
      EditorView.theme({
        "&": {
          backgroundColor: "hsl(0, 0%, 100%)",
          color: "hsl(240, 10%, 3.9%)",
        },
        ".cm-gutters": {
          backgroundColor: "hsl(0, 0%, 100%)",
          color: "hsl(240, 3.8%, 46.1%)",
          borderRight: "1px solid hsl(240, 5.9%, 90%)",
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        },
        ".cm-activeLineGutter": {
          backgroundColor: "hsl(240, 4.8%, 95.9%)",
        },
        ".cm-activeLine": {
          backgroundColor: "hsl(240, 4.8%, 95.9%, 0.5)",
        },
        ".cm-content": {
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontSize: "13px",
          lineHeight: "1.6",
        },
      }),
    [],
  );

  const extensions = useMemo(() => {
    return [
      json(),
      theme === "dark" ? darkTheme : lightTheme,
      EditorView.lineWrapping,
      focusHandlers,
    ];
  }, [theme, darkTheme, lightTheme, focusHandlers]);

  const handleFormat = useCallback(() => {
    try {
      const parsed = JSON.parse(localValue);
      const formatted = JSON.stringify(parsed, null, 2);
      setLocalValue(formatted);
      applyRef.current(formatted);
      toast.success(t("jsonEditor.jsonFormatted"));
    } catch {
      toast.error(t("jsonEditor.cannotFormatInvalidJson"));
    }
  }, [localValue, t]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(localValue);
      toast.success(t("jsonEditor.copiedToClipboard"));
    } catch {
      toast.error(t("jsonEditor.failedToCopy"));
    }
  }, [localValue, t]);

  const toggleLineNumbers = useCallback(() => {
    setShowLineNumbers((prev) => !prev);
  }, []);

  if (!currentProject) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
        <FileCode className="h-10 w-10 opacity-40" />
        <p className="text-sm">{t("jsonEditor.noProjectLoaded")}</p>
        <Toaster position="bottom-center" richColors />
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-full flex-col overflow-hidden">
        <div className="flex items-center gap-1.5 border-b px-3 py-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleFormat}>
                <Braces className="mr-1 h-3.5 w-3.5" />
                Format
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("jsonEditor.formatJson")}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleCopy}>
                <Copy className="mr-1 h-3.5 w-3.5" />
                Copy
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("jsonEditor.copyToClipboard")}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showLineNumbers ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={toggleLineNumbers}
              >
                <Hash className="mr-1 h-3.5 w-3.5" />
                {t("jsonEditor.lines")}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {showLineNumbers ? t("jsonEditor.hideLineNumbers") : t("jsonEditor.showLineNumbers")}
            </TooltipContent>
          </Tooltip>

          <div className="flex-1" />

          {detached && currentProject.chart.binding && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              onClick={reattach}
            >
              <Link2 className="h-3.5 w-3.5" />
              {t("jsonEditor.reattach")}
            </Button>
          )}

          {diagnostics.length > 0 && (
            <Badge variant="destructive" className="gap-1 text-xs">
              <AlertCircle className="h-3 w-3" />
              {diagnostics.length} {diagnostics.length === 1 ? "error" : "errors"}
            </Badge>
          )}
        </div>

        <div className="flex-1 overflow-hidden">
          <CodeMirror
            value={localValue}
            onChange={onChange}
            onCreateEditor={(view) => {
              viewRef.current = view;
            }}
            extensions={extensions}
            basicSetup={{
              lineNumbers: showLineNumbers,
              highlightActiveLine: true,
              highlightActiveLineGutter: true,
              foldGutter: true,
              bracketMatching: true,
              closeBrackets: true,
              autocompletion: true,
              indentOnInput: true,
              tabSize: 2,
            }}
            className="h-full"
            theme="none"
          />
        </div>

        {diagnostics.length > 0 && (
          <div className="max-h-32 shrink-0 overflow-y-auto border-t bg-destructive/5">
            {diagnostics.map((d, i) => (
              <button
                key={i}
                className="flex w-full items-start gap-2 px-3 py-1.5 text-left text-xs hover:bg-destructive/10"
                onClick={() => goToDiagnostic(d)}
              >
                <AlertCircle className="mt-0.5 h-3 w-3 shrink-0 text-destructive" />
                <span className="font-mono text-muted-foreground">
                  {d.line}:{d.col}
                </span>
                <span className="text-destructive">{d.message}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <Toaster position="bottom-center" richColors />
    </TooltipProvider>
  );
}
