# ECharts Studio

A cross-platform desktop application for creating, editing, and visualizing Apache ECharts — with a built-in spreadsheet editor, real-time preview, and full JSON option control.

![Tauri](https://img.shields.io/badge/Tauri-2-orange)
![React](https://img.shields.io/badge/React-19-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6)

## Features

- **Live Chart Preview** — see changes instantly as you edit data and configuration
- **Spreadsheet-like Data Editor** — create, import (CSV/JSON), sort, copy/paste, and manage datasets with a full-featured table UI
- **Data-to-Chart Binding** — map dataset columns to a generated chart. Supported chart types: **bar, line, scatter, pie, radar**
- **Derived option model** — the binding generates a base option and your manual edits are stored as *overrides* merged on top, so tweaking a style never breaks the dataset link
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
| Build | [Vite 8](https://vite.dev/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| UI Components | [Radix UI](https://www.radix-ui.com/) (shadcn/ui) |
| State | [Zustand 5](https://zustand-demo.pmnd.rs/) + [Immer](https://immerjs.github.io/immer/) (patch-based undo/redo) |
| Charting | [Apache ECharts 6](https://echarts.apache.org/) |
| Code Editor | [CodeMirror 6](https://codemirror.net/) |
| Testing | [Vitest](https://vitest.dev/) + [ESLint](https://eslint.org/) |
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
cd Echarts-Studio

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

### Testing & Linting

```bash
npm test          # run the Vitest suite once
npm run test:watch # watch mode
npm run lint      # ESLint
npm run build     # type-check (tsc) + production build
```

## Project Structure

```
src/
├── App.tsx                      # Root — theme, global shortcuts
├── stores/
│   ├── projectStore.ts          # Project state, binding/overrides, patch-based undo/redo
│   └── uiStore.ts               # Theme, panels, language (persisted)
├── components/
│   ├── layout/                  # App shell, toolbar, sidebar, bottom panel
│   ├── chart/                   # Live ECharts preview + render error boundary
│   ├── data/                    # Spreadsheet data editor
│   ├── inspector/               # Property inspector & tree view
│   ├── json-editor/             # CodeMirror raw JSON editor
│   └── ui/                      # Radix-based UI primitives
├── lib/
│   ├── chart/                   # resolveOption (base + overrides), deepMerge, diff, paths
│   ├── data/datasetToOption.ts  # Dataset + binding → ECharts base option
│   ├── persistence/migrations.ts # Schema migration (1.0.0 → 2.0.0)
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

## Documentation

- [`docs/prompt.md`](docs/prompt.md) — the original product brief / design specification the application was built from.

