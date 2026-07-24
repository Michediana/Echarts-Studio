import { useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import { useUIStore } from "@/stores/uiStore";
import { useProjectStore } from "@/stores/projectStore";
import { useT } from "@/lib/i18n/context";
import { runUpdateCheck } from "@/lib/updater";

function applyThemeClass(theme: "light" | "dark") {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
}

export default function App() {
  const t = useT();
  const theme = useUIStore((s) => s.theme);
  const saveProject = useProjectStore((s) => s.saveProject);
  const createProject = useProjectStore((s) => s.createProject);
  const undo = useProjectStore((s) => s.undo);
  const redo = useProjectStore((s) => s.redo);
  const loadRecentProjects = useProjectStore((s) => s.loadRecentProjects);

  useEffect(() => {
    // Silenzioso: fuori da Tauri (npm run dev) o con l'endpoint irraggiungibile
    // il check fallisce, e non deve disturbare l'avvio.
    void runUpdateCheck({ silent: true, t });
    // Volutamente solo all'avvio: un cambio di lingua non deve rifare il check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  useEffect(() => {
    loadRecentProjects();
  }, [loadRecentProjects]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      const key = e.key.toLowerCase();

      if (key === "s") {
        e.preventDefault();
        saveProject().catch((err) => {
          console.error("Save failed:", err);
        });
        return;
      }

      if (key === "n") {
        e.preventDefault();
        createProject();
        return;
      }

      if (key === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveProject, createProject, undo, redo]);

  return <AppShell />;
}
