import { useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import { useUIStore } from "@/stores/uiStore";
import { useProjectStore } from "@/stores/projectStore";

function applyThemeClass(theme: "light" | "dark") {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
}

export default function App() {
  const theme = useUIStore((s) => s.theme);
  const saveProject = useProjectStore((s) => s.saveProject);
  const createProject = useProjectStore((s) => s.createProject);
  const undo = useProjectStore((s) => s.undo);
  const redo = useProjectStore((s) => s.redo);
  const loadRecentProjects = useProjectStore((s) => s.loadRecentProjects);

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
