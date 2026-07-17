import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UIState } from "@/types/project";
import { DEFAULT_UI_STATE } from "@/types/project";

interface UIStore extends UIState {
  commandPaletteOpen: boolean;
  inspectorCollapsed: boolean;
  sidebarCollapsed: boolean;

  setTheme: (theme: UIState["theme"]) => void;
  toggleTheme: () => void;
  setLanguage: (lang: UIState["language"]) => void;
  setSidebarWidth: (width: number) => void;
  setInspectorWidth: (width: number) => void;
  setBottomPanelHeight: (height: number) => void;
  toggleBottomPanel: () => void;
  setSelectedNodePath: (path: string | null) => void;
  setLastActiveTab: (tab: string) => void;
  setBottomPanelTab: (tab: string) => void;
  setInspectorTab: (tab: string) => void;
  setMode: (mode: UIState["mode"]) => void;
  toggleMode: () => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleSidebar: () => void;
  toggleInspector: () => void;
}

const initialState: UIState = { ...DEFAULT_UI_STATE };

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      ...initialState,
      commandPaletteOpen: false,
      inspectorCollapsed: false,
      sidebarCollapsed: false,

      setTheme: (theme) => set({ theme } as Partial<UIStore>),
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === "light" ? "dark" : "light",
        } as Partial<UIStore>)),

      setLanguage: (lang) => set({ language: lang } as Partial<UIStore>),

      setSidebarWidth: (width) => set({ sidebarWidth: width } as Partial<UIStore>),
      setInspectorWidth: (width) => set({ inspectorWidth: width } as Partial<UIStore>),
      setBottomPanelHeight: (height) => set({ bottomPanelHeight: height } as Partial<UIStore>),

      toggleBottomPanel: () =>
        set((state) => ({
          bottomPanelOpen: !state.bottomPanelOpen,
        } as Partial<UIStore>)),

      setSelectedNodePath: (path) => set({ selectedNodePath: path } as Partial<UIStore>),
      setLastActiveTab: (tab) => set({ lastActiveTab: tab } as Partial<UIStore>),
      setBottomPanelTab: (tab) => set({ bottomPanelTab: tab } as Partial<UIStore>),
      setInspectorTab: (tab) => set({ inspectorTab: tab } as Partial<UIStore>),

      setMode: (mode) => set({ mode } as Partial<UIStore>),
      toggleMode: () =>
        set((state) => ({
          mode: state.mode === "basic" ? "advanced" : "basic",
        } as Partial<UIStore>)),

      openCommandPalette: () => set({ commandPaletteOpen: true } as Partial<UIStore>),
      closeCommandPalette: () => set({ commandPaletteOpen: false } as Partial<UIStore>),

      toggleSidebar: () =>
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed,
        } as Partial<UIStore>)),

      toggleInspector: () =>
        set((state) => ({
          inspectorCollapsed: !state.inspectorCollapsed,
        } as Partial<UIStore>)),
    }),
    {
      name: "echarts-studio:ui",
      partialize: (state) => ({
        theme: state.theme,
        mode: state.mode,
        language: state.language,
        sidebarWidth: state.sidebarWidth,
        inspectorWidth: state.inspectorWidth,
        bottomPanelHeight: state.bottomPanelHeight,
        sidebarCollapsed: state.sidebarCollapsed,
        inspectorCollapsed: state.inspectorCollapsed,
      }),
    },
  ),
);
