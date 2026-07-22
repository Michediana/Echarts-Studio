# ECharts Studio

A cross-platform desktop application for creating, editing, and visualizing Apache ECharts — with a built-in spreadsheet editor, real-time preview, and full JSON option control.

![Tauri](https://img.shields.io/badge/Tauri-2-orange)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6)

## Features

- **Live Chart Preview** — see changes instantly as you edit data and configuration
- **Spreadsheet-like Data Editor** — create, import (CSV/JSON), sort, copy/paste, and manage datasets with a full-featured table UI
- **Data-to-Chart Binding** — map dataset columns to axes and series (bar, line, pie, scatter, radar)
- **Property Inspector** — browse and modify any ECharts option through a type-aware tree view
- **Raw JSON Editor** — CodeMirror-powered editor for direct option manipulation
- **Undo / Redo** — full history tracking with keyboard shortcuts (`Ctrl+Z` / `Ctrl+Shift+Z`)
- **Chart Templates** — start quickly with pre-built chart configurations
- **Command Palette** — `Ctrl+K` to access every action in the app
- **Dark & Light Themes** — automatically matches your system preference
- **English & Italian** — full localization support
- **Export** — save charts as PNG, JSON config, or standalone HTML
- **Save Projects** — persist your work as `.echarts.json` files via native file dialogs

## Tech Stack

| Layer | Technology |
|---|---|
| Desktop Shell | [Tauri 2](https://tauri.app/) (Rust) |
| Frontend | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| Build | [Vite 7](https://vite.dev/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| UI Components | [Radix UI](https://www.radix-ui.com/) (shadcn/ui) |
| State | [Zustand 5](https://zustand-demo.pmnd.rs/) |
| Charting | [Apache ECharts 5](https://echarts.apache.org/) |
| Code Editor | [CodeMirror 6](https://codemirror.net/) |
| Icons | [Lucide React](https://lucide.dev/) |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- [Rust](https://www.rust-lang.org/tools/install) (for Tauri)
- System dependencies for Tauri — see the [Tauri prerequisites guide](https://tauri.app/start/prerequisites/)

### Install & Run

```bash
# Clone the repo
git clone https://github.com/Michediana/Echarts-Studio.git
cd Echarts-Desktop

# Install dependencies
npm install

# Start the dev server
npm run tauri dev
```

### Build for Production

```bash
npm run tauri build
```

The compiled binary and installer will be in `src-tauri/target/release/bundle/`.

## Project Structure

```
src/
├── App.tsx                      # Root — theme, global shortcuts
├── stores/
│   ├── projectStore.ts          # Project state, datasets, bindings, undo/redo
│   └── uiStore.ts               # Theme, panels, language (persisted)
├── components/
│   ├── layout/                  # App shell, toolbar, sidebar, bottom panel
│   ├── chart/                   # Live ECharts preview
│   ├── data/                    # Spreadsheet data editor
│   ├── inspector/               # Property inspector & tree view
│   ├── json-editor/             # CodeMirror raw JSON editor
│   └── ui/                      # Radix-based UI primitives
├── lib/
│   ├── data/datasetToOption.ts  # Dataset + binding → ECharts option
│   ├── i18n/                    # English & Italian translations
│   └── schema/                  # ECharts property registry
├── templates/                   # Pre-built chart templates
└── types/project.ts             # Core type definitions
```

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |
| `Ctrl+S` | Save project |
| `Ctrl+N` | New project |
| `Ctrl+K` | Command palette |

