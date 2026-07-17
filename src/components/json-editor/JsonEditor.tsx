import { useMemo, useCallback, useState, useRef, useEffect } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { EditorView } from "@codemirror/view";
import { Toaster, toast } from "sonner";
import { useProjectStore } from "@/stores/projectStore";
import { useUIStore } from "@/stores/uiStore";
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
} from "lucide-react";
import { useT } from "@/lib/i18n/context";

function debounce<F extends (value: string) => void>(fn: F, ms: number): F & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout>;
  const debounced = (value: string) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(value), ms);
  };
  (debounced as F & { cancel: () => void }).cancel = () => clearTimeout(timer);
  return debounced as F & { cancel: () => void };
}

export default function JsonEditor() {
  const t = useT();
  const currentProject = useProjectStore((s) => s.currentProject);
  const updateChartOption = useProjectStore((s) => s.updateChartOption);
  const theme = useUIStore((s) => s.theme);

  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [errorCount, setErrorCount] = useState(0);
  const [localValue, setLocalValue] = useState("");

  useEffect(() => {
    if (currentProject) {
      const formatted = JSON.stringify(currentProject.chart.option, null, 2);
      setLocalValue(formatted);
      setErrorCount(0);
    }
  }, [currentProject?.id]);

  const debouncedUpdate = useRef(
    debounce((value: string) => {
      try {
        const parsed = JSON.parse(value);
        updateChartOption(parsed);
        setErrorCount(0);
      } catch {
        const lines = value.split("\n");
        let count = 0;
        try {
          let depth = 0;
          for (const line of lines) {
            for (const ch of line) {
              if (ch === "{") depth++;
              if (ch === "}") depth--;
            }
          }
          if (depth !== 0) count = Math.abs(depth);
        } catch {
          count = 1;
        }
        setErrorCount(count || 1);
      }
    }, 300),
  );

  useEffect(() => {
    return () => debouncedUpdate.current.cancel();
  }, []);

  const onChange = useCallback((value: string) => {
    setLocalValue(value);
    debouncedUpdate.current(value);
  }, []);

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
    const exts = [
      json(),
      theme === "dark" ? darkTheme : lightTheme,
      EditorView.lineWrapping,
    ];
    return exts;
  }, [theme, darkTheme, lightTheme]);

  const handleFormat = useCallback(() => {
    try {
      const parsed = JSON.parse(localValue);
      const formatted = JSON.stringify(parsed, null, 2);
      setLocalValue(formatted);
      updateChartOption(parsed);
      setErrorCount(0);
      toast.success(t("jsonEditor.jsonFormatted"));
    } catch {
      toast.error(t("jsonEditor.cannotFormatInvalidJson"));
    }
  }, [localValue, updateChartOption, t]);

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
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleFormat}
              >
                <Braces className="mr-1 h-3.5 w-3.5" />
                Format
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("jsonEditor.formatJson")}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={handleCopy}
              >
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

          {errorCount > 0 && (
            <Badge variant="destructive" className="gap-1 text-xs">
              <AlertCircle className="h-3 w-3" />
              {errorCount} {errorCount === 1 ? "error" : "errors"}
            </Badge>
          )}
        </div>

        <div className="flex-1 overflow-hidden">
          <CodeMirror
            value={localValue}
            onChange={onChange}
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
      </div>
      <Toaster position="bottom-center" richColors />
    </TooltipProvider>
  );
}
