import { useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import { useUIStore } from "@/stores/uiStore";
import { useProjectStore } from "@/stores/projectStore";
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

function applyThemeClass(theme: "light" | "dark") {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
}

async function checkForUpdates() {
  const update = await check();
  if (!update) return;

  console.log(`Nuovo aggiornamento trovato: ${update.version}`);

  // Scarica e installa i pacchetti
  await update.downloadAndInstall();

  // Riavvia l'applicazione per applicare le modifiche
  await relaunch();
}

export default function App() {
  const theme = useUIStore((s) => s.theme);
  const saveProject = useProjectStore((s) => s.saveProject);
  const createProject = useProjectStore((s) => s.createProject);
  const undo = useProjectStore((s) => s.undo);
  const redo = useProjectStore((s) => s.redo);
  const loadRecentProjects = useProjectStore((s) => s.loadRecentProjects);

  useEffect(() => {
    // Fallisce silenziosamente fuori da Tauri (npm run dev) o se l'endpoint
    // non e' raggiungibile: un update mancato non deve bloccare l'avvio.
    checkForUpdates().catch((err) => {
      console.error("Update check failed:", err);
    });
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
