export type Language = "en" | "it";

export const LANGUAGES: { code: Language; label: string }[] = [
  { code: "en", label: "English" },
  { code: "it", label: "Italiano" },
];

type TranslationKeys = {
  // Toolbar
  "toolbar.appName": string;
  "toolbar.newProject": string;
  "toolbar.openProject": string;
  "toolbar.save": string;
  "toolbar.saveNoChanges": string;
  "toolbar.saveAs": string;
  "toolbar.undo": string;
  "toolbar.redo": string;
  "toolbar.toggleAdvancedMode": string;
  "toolbar.modeBasic": string;
  "toolbar.modeAdvanced": string;
  "toolbar.switchToLightTheme": string;
  "toolbar.switchToDarkTheme": string;
  "toolbar.exportChartAsImage": string;
  "toolbar.commandPalette": string;
  "toolbar.selectChartType": string;

  // Sidebar
  "sidebar.tabProject": string;
  "sidebar.tabData": string;
  "sidebar.tabTemplates": string;
  "sidebar.templateAppliedDetached": string;
  "sidebar.noProject": string;
  "sidebar.noProjectHint": string;
  "sidebar.name": string;
  "sidebar.projectNamePlaceholder": string;
  "sidebar.description": string;
  "sidebar.descriptionPlaceholder": string;
  "sidebar.tags": string;
  "sidebar.addTagPlaceholder": string;
  "sidebar.removeTag": string;
  "sidebar.created": string;
  "sidebar.updated": string;
  "sidebar.datasetsCount": string;
  "sidebar.new": string;
  "sidebar.import": string;
  "sidebar.noDatasets": string;
  "sidebar.noDatasetsHint": string;
  "sidebar.rowsColumns": string;
  "sidebar.chartTemplatesCount": string;
  "sidebar.inUse": string;
  "sidebar.templateConfirmTitle": string;
  "sidebar.templateConfirmDesc": string;
  "sidebar.templateConfirmCancel": string;
  "sidebar.templateConfirmApply": string;

  // ChartStatusBar
  "chartStatus.source": string;
  "chartStatus.editMapping": string;
  "chartStatus.detached": string;
  "chartStatus.reattach": string;
  "chartStatus.empty": string;
  "chartStatus.linkData": string;
  "chartStatus.customizations": string;
  "chartStatus.reset": string;
  "chartStatus.resetTitle": string;
  "chartStatus.resetDesc": string;
  "chartStatus.reattachTitle": string;
  "chartStatus.reattachDesc": string;
  "chartStatus.cancel": string;

  // BottomPanel
  "bottomPanel.tabJson": string;
  "bottomPanel.tabData": string;
  "bottomPanel.tabConsole": string;
  "bottomPanel.tabTransforms": string;
  "bottomPanel.noConsoleOutput": string;
  "bottomPanel.noProjectLoaded": string;
  "bottomPanel.transformPipeline": string;
  "bottomPanel.comingSoon": string;

  // CommandPalette
  "commandPalette.ariaLabel": string;
  "commandPalette.searchPlaceholder": string;
  "commandPalette.noCommandsFound": string;
  "commandPalette.sectionFile": string;
  "commandPalette.sectionView": string;
  "commandPalette.sectionEdit": string;
  "commandPalette.sectionChart": string;
  "commandPalette.sectionHelp": string;
  "commandPalette.newProject": string;
  "commandPalette.newProjectDesc": string;
  "commandPalette.openProject": string;
  "commandPalette.openProjectDesc": string;
  "commandPalette.save": string;
  "commandPalette.saveDesc": string;
  "commandPalette.saveAs": string;
  "commandPalette.saveAsDesc": string;
  "commandPalette.exportPng": string;
  "commandPalette.exportPngDesc": string;
  "commandPalette.exportJson": string;
  "commandPalette.exportJsonDesc": string;
  "commandPalette.toggleSidebar": string;
  "commandPalette.toggleSidebarDesc": string;
  "commandPalette.toggleInspector": string;
  "commandPalette.toggleInspectorDesc": string;
  "commandPalette.toggleBottomPanel": string;
  "commandPalette.toggleBottomPanelDesc": string;
  "commandPalette.toggleDarkLight": string;
  "commandPalette.switchToLight": string;
  "commandPalette.switchToDark": string;
  "commandPalette.toggleBasicAdvanced": string;
  "commandPalette.toggleBasicAdvancedDesc": string;
  "commandPalette.undo": string;
  "commandPalette.undoDesc": string;
  "commandPalette.redo": string;
  "commandPalette.redoDesc": string;
  "commandPalette.barChart": string;
  "commandPalette.lineChart": string;
  "commandPalette.pieChart": string;
  "commandPalette.scatterChart": string;
  "commandPalette.radarChart": string;
  "commandPalette.documentation": string;
  "commandPalette.documentationDesc": string;

  // ChartPreview
  "chartPreview.openOrCreate": string;
  "chartPreview.failedRefresh": string;
  "chartPreview.failedExportPng": string;
  "chartPreview.dismiss": string;
  "chartPreview.refresh": string;
  "chartPreview.exitFullscreen": string;
  "chartPreview.fullscreen": string;
  "chartPreview.exportAsPng": string;
  "chartPreview.comingSoon": string;
  "chartPreview.exportPngTitle": string;
  "chartPreview.exportPngDesc": string;
  "chartPreview.width": string;
  "chartPreview.height": string;
  "chartPreview.dpi": string;
  "chartPreview.outputSize": string;
  "chartPreview.cancel": string;
  "chartPreview.export": string;
  "chartPreview.exporting": string;

  // PropertyInspector
  "inspector.noPropertiesFound": string;
  "inspector.tryDifferentSearch": string;
  "inspector.searchResultsCount": string;
  "inspector.searchPropertiesPlaceholder": string;
  "inspector.clearSearch": string;
  "inspector.tabProperties": string;
  "inspector.tabStructure": string;
  "inspector.resetAll": string;
  "inspector.noOptionDefined": string;

  // PropertyField
  "propertyField.resetToDefault": string;
  "propertyField.selectPlaceholder": string;
  "propertyField.emptyOption": string;
  "propertyField.functionPlaceholder": string;

  // TreeView
  "treeView.collapse": string;
  "treeView.expand": string;
  "treeView.itemsCount": string;
  "treeView.keysCount": string;
  "treeView.emptyArray": string;
  "treeView.emptyObject": string;

  // JsonEditor
  "jsonEditor.noProjectLoaded": string;
  "jsonEditor.formatJson": string;
  "jsonEditor.copyToClipboard": string;
  "jsonEditor.showLineNumbers": string;
  "jsonEditor.hideLineNumbers": string;
  "jsonEditor.lines": string;
  "jsonEditor.jsonFormatted": string;
  "jsonEditor.cannotFormatInvalidJson": string;
  "jsonEditor.copiedToClipboard": string;
  "jsonEditor.failedToCopy": string;
  "jsonEditor.rootMustBeObject": string;
  "jsonEditor.detachedWarning": string;
  "jsonEditor.reattach": string;
  "jsonEditor.reattached": string;

  // DataEditor
  "dataEditor.noProjectLoaded": string;
  "dataEditor.selectOrCreateDataset": string;
  "dataEditor.selectDatasetPlaceholder": string;
  "dataEditor.importCsv": string;
  "dataEditor.addRow": string;
  "dataEditor.columnNamePlaceholder": string;
  "dataEditor.addCol": string;
  "dataEditor.invalidCells": string;
  "dataEditor.sortTooltip": string;
  "dataEditor.deleteColumnTooltip": string;
  "dataEditor.sortedAsc": string;
  "dataEditor.sortedDesc": string;
  "dataEditor.deleteRowTooltip": string;
  "dataEditor.noRowsHint": string;
  "dataEditor.rowsColumnsFooter": string;
  "dataEditor.importedRows": string;
  "dataEditor.failedParseCsv": string;
  "dataEditor.bindingTitle": string;
  "dataEditor.bindingSeries": string;
  "dataEditor.bindingEnable": string;
  "dataEditor.bindingHint": string;
  "dataEditor.bindingDisable": string;
  "dataEditor.bindingSelectColumn": string;
  "dataEditor.bindingNamePlaceholder": string;
  "dataEditor.bindingAddSeries": string;
  "dataEditor.bindingPieName": string;
  "dataEditor.bindingPieValue": string;
  "dataEditor.bindingAddIndicator": string;

  // Context menu
  "dataEditor.contextCut": string;
  "dataEditor.contextCopy": string;
  "dataEditor.contextPaste": string;
  "dataEditor.contextDelete": string;
  "dataEditor.contextInsertRowAbove": string;
  "dataEditor.contextInsertRowBelow": string;
  "dataEditor.contextInsertColLeft": string;
  "dataEditor.contextInsertColRight": string;
  "dataEditor.contextDeleteRow": string;
  "dataEditor.contextDeleteCol": string;

  // ExportDialog
  "export.title": string;
  "export.description": string;
  "export.pngImage": string;
  "export.pngDescription": string;
  "export.download": string;
  "export.copied": string;
  "export.copy": string;
  "export.svgImage": string;
  "export.svgDescription": string;
  "export.comingSoon": string;
  "export.jsonConfig": string;
  "export.jsonDescription": string;
  "export.htmlStandalone": string;
  "export.htmlDescription": string;
  "export.projectFile": string;
  "export.projectDescription": string;
};

export const translations: Record<Language, TranslationKeys> = {
  en: {
    // Toolbar
    "toolbar.appName": "ECharts Studio",
    "toolbar.newProject": "New Project",
    "toolbar.openProject": "Open Project",
    "toolbar.save": "Save",
    "toolbar.saveNoChanges": "Save (no changes)",
    "toolbar.saveAs": "Save As...",
    "toolbar.undo": "Undo",
    "toolbar.redo": "Redo",
    "toolbar.toggleAdvancedMode": "Toggle advanced mode",
    "toolbar.modeBasic": "Basic",
    "toolbar.modeAdvanced": "Advanced",
    "toolbar.switchToLightTheme": "Switch to light theme",
    "toolbar.switchToDarkTheme": "Switch to dark theme",
    "toolbar.exportChartAsImage": "Export chart as image",
    "toolbar.commandPalette": "Command Palette (⌘K)",
    "toolbar.selectChartType": "Chart type",

    // Sidebar
    "sidebar.tabProject": "Project",
    "sidebar.tabData": "Data",
    "sidebar.tabTemplates": "Templates",
    "sidebar.templateAppliedDetached": "Template applied — chart detached from the dataset",
    "sidebar.noProject": "No project open.",
    "sidebar.noProjectHint": "Create or open a project to get started.",
    "sidebar.name": "Name",
    "sidebar.projectNamePlaceholder": "Project name",
    "sidebar.description": "Description",
    "sidebar.descriptionPlaceholder": "Add a description...",
    "sidebar.tags": "Tags",
    "sidebar.addTagPlaceholder": "Add tag...",
    "sidebar.removeTag": "Remove tag",
    "sidebar.created": "Created:",
    "sidebar.updated": "Updated:",
    "sidebar.datasetsCount": "Datasets",
    "sidebar.new": "New",
    "sidebar.import": "Import",
    "sidebar.noDatasets": "No datasets yet.",
    "sidebar.noDatasetsHint": "Add one to get started.",
    "sidebar.rowsColumns": "rows · columns",
    "sidebar.chartTemplatesCount": "Chart Templates",
    "sidebar.inUse": "in use",
    "sidebar.templateConfirmTitle": "Apply this template?",
    "sidebar.templateConfirmDesc":
      "This replaces the current chart and detaches it from your data. Your datasets are kept, but the chart configuration will be lost.",
    "sidebar.templateConfirmCancel": "Cancel",
    "sidebar.templateConfirmApply": "Apply template",

    // ChartStatusBar
    "chartStatus.source": "Data source:",
    "chartStatus.editMapping": "Edit mapping",
    "chartStatus.detached": "Custom template — not linked to any data",
    "chartStatus.reattach": "Link to data",
    "chartStatus.empty": "No data linked",
    "chartStatus.linkData": "Link data",
    "chartStatus.customizations": "{count} customizations",
    "chartStatus.reset": "Reset",
    "chartStatus.resetTitle": "Reset customizations?",
    "chartStatus.resetDesc":
      "Removes all manual edits and shows the chart exactly as generated from the data. This cannot be undone from here (use Undo).",
    "chartStatus.reattachTitle": "Link the chart to data?",
    "chartStatus.reattachDesc":
      "The chart will be regenerated from your first dataset. Manual series and axes from the template will be replaced by the data.",
    "chartStatus.cancel": "Cancel",

    // BottomPanel
    "bottomPanel.tabJson": "JSON",
    "bottomPanel.tabData": "Data",
    "bottomPanel.tabConsole": "Console",
    "bottomPanel.tabTransforms": "Transforms",
    "bottomPanel.noConsoleOutput": "No console output",
    "bottomPanel.noProjectLoaded": "No project loaded",
    "bottomPanel.transformPipeline": "Transform pipeline",
    "bottomPanel.comingSoon": "Coming soon",

    // CommandPalette
    "commandPalette.ariaLabel": "Command palette",
    "commandPalette.searchPlaceholder": "Search commands...",
    "commandPalette.noCommandsFound": "No commands found.",
    "commandPalette.sectionFile": "File",
    "commandPalette.sectionView": "View",
    "commandPalette.sectionEdit": "Edit",
    "commandPalette.sectionChart": "Chart",
    "commandPalette.sectionHelp": "Help",
    "commandPalette.newProject": "New Project",
    "commandPalette.newProjectDesc": "Create a new empty project",
    "commandPalette.openProject": "Open Project",
    "commandPalette.openProjectDesc": "Open an existing project file",
    "commandPalette.save": "Save",
    "commandPalette.saveDesc": "Save the current project",
    "commandPalette.saveAs": "Save As",
    "commandPalette.saveAsDesc": "Save the project to a new location",
    "commandPalette.exportPng": "Export PNG",
    "commandPalette.exportPngDesc": "Export the chart as a PNG image",
    "commandPalette.exportJson": "Export JSON",
    "commandPalette.exportJsonDesc": "Export the chart config as JSON",
    "commandPalette.toggleSidebar": "Toggle Sidebar",
    "commandPalette.toggleSidebarDesc": "Show or hide the left sidebar",
    "commandPalette.toggleInspector": "Toggle Inspector",
    "commandPalette.toggleInspectorDesc": "Show or hide the right inspector panel",
    "commandPalette.toggleBottomPanel": "Toggle Bottom Panel",
    "commandPalette.toggleBottomPanelDesc": "Show or hide the bottom data panel",
    "commandPalette.toggleDarkLight": "Toggle Dark/Light Mode",
    "commandPalette.switchToLight": "Switch to light mode",
    "commandPalette.switchToDark": "Switch to dark mode",
    "commandPalette.toggleBasicAdvanced": "Toggle Basic/Advanced Mode",
    "commandPalette.toggleBasicAdvancedDesc": "Switch between basic and advanced editing mode",
    "commandPalette.undo": "Undo",
    "commandPalette.undoDesc": "Undo the last action",
    "commandPalette.redo": "Redo",
    "commandPalette.redoDesc": "Redo the last undone action",
    "commandPalette.barChart": "Bar Chart",
    "commandPalette.lineChart": "Line Chart",
    "commandPalette.pieChart": "Pie Chart",
    "commandPalette.scatterChart": "Scatter Chart",
    "commandPalette.radarChart": "Radar Chart",
    "commandPalette.documentation": "Documentation",
    "commandPalette.documentationDesc": "Open the ECharts documentation",

    // ChartPreview
    "chartPreview.openOrCreate": "Open or create a project to start",
    "chartPreview.failedRefresh": "Failed to refresh chart",
    "chartPreview.failedExportPng": "Failed to export PNG",
    "chartPreview.dismiss": "Dismiss",
    "chartPreview.refresh": "Refresh",
    "chartPreview.exitFullscreen": "Exit fullscreen",
    "chartPreview.fullscreen": "Fullscreen",
    "chartPreview.exportAsPng": "Export as PNG",
    "chartPreview.comingSoon": "Coming soon",
    "chartPreview.exportPngTitle": "Export PNG",
    "chartPreview.exportPngDesc": "Configure the image size and resolution",
    "chartPreview.width": "Width (px)",
    "chartPreview.height": "Height (px)",
    "chartPreview.dpi": "Resolution",
    "chartPreview.outputSize": "Output size",
    "chartPreview.cancel": "Cancel",
    "chartPreview.export": "Export",
    "chartPreview.exporting": "Exporting…",

    // PropertyInspector
    "inspector.noPropertiesFound": "No properties found",
    "inspector.tryDifferentSearch": "Try a different search term",
    "inspector.searchResultsCount": "results",
    "inspector.searchPropertiesPlaceholder": "Search properties...",
    "inspector.clearSearch": "Clear search",
    "inspector.tabProperties": "Properties",
    "inspector.tabStructure": "Structure",
    "inspector.resetAll": "Reset All",
    "inspector.noOptionDefined": "No option defined",

    // PropertyField
    "propertyField.resetToDefault": "Reset to default",
    "propertyField.selectPlaceholder": "Select...",
    "propertyField.emptyOption": "(empty)",
    "propertyField.functionPlaceholder": "() => value",

    // TreeView
    "treeView.collapse": "Collapse",
    "treeView.expand": "Expand",
    "treeView.itemsCount": "items",
    "treeView.keysCount": "keys",
    "treeView.emptyArray": "Empty array",
    "treeView.emptyObject": "Empty object",

    // JsonEditor
    "jsonEditor.noProjectLoaded": "No project loaded",
    "jsonEditor.formatJson": "Format JSON",
    "jsonEditor.copyToClipboard": "Copy to clipboard",
    "jsonEditor.showLineNumbers": "Show line numbers",
    "jsonEditor.hideLineNumbers": "Hide line numbers",
    "jsonEditor.lines": "Lines",
    "jsonEditor.jsonFormatted": "JSON formatted",
    "jsonEditor.cannotFormatInvalidJson": "Cannot format: invalid JSON",
    "jsonEditor.copiedToClipboard": "Copied to clipboard",
    "jsonEditor.failedToCopy": "Failed to copy",
    "jsonEditor.rootMustBeObject": "The root value must be a JSON object",
    "jsonEditor.detachedWarning": "This change detaches the chart from the dataset",
    "jsonEditor.reattach": "Reattach dataset",
    "jsonEditor.reattached": "Chart reattached to the dataset (manual edits discarded)",

    // DataEditor
    "dataEditor.noProjectLoaded": "No project loaded",
    "dataEditor.selectOrCreateDataset": "Select a dataset or create a new one",
    "dataEditor.selectDatasetPlaceholder": "Select dataset",
    "dataEditor.importCsv": "Import CSV",
    "dataEditor.addRow": "Row",
    "dataEditor.columnNamePlaceholder": "Column name",
    "dataEditor.addCol": "Col",
    "dataEditor.invalidCells": "Invalid cells",
    "dataEditor.sortTooltip": "Sort",
    "dataEditor.deleteColumnTooltip": "Delete column",
    "dataEditor.sortedAsc": "↑ sorted",
    "dataEditor.sortedDesc": "↓ sorted",
    "dataEditor.deleteRowTooltip": "Delete row",
    "dataEditor.noRowsHint": "No rows. Click \"Row\" to add one.",
    "dataEditor.rowsColumnsFooter": "rows · columns",
    "dataEditor.importedRows": "Imported rows from",
    "dataEditor.failedParseCsv": "Failed to parse CSV file",
    "dataEditor.bindingTitle": "Map Data to Chart",
    "dataEditor.bindingSeries": "series",
    "dataEditor.bindingEnable": "Link to chart",
    "dataEditor.bindingHint": "Connect this dataset to the chart — columns become axes and series.",
    "dataEditor.bindingDisable": "Unlink",
    "dataEditor.bindingSelectColumn": "Select column",
    "dataEditor.bindingNamePlaceholder": "Label",
    "dataEditor.bindingAddSeries": "Add series",
    "dataEditor.bindingPieName": "Name",
    "dataEditor.bindingPieValue": "Value",
    "dataEditor.bindingAddIndicator": "Add indicator",

    // Context menu
    "dataEditor.contextCut": "Cut",
    "dataEditor.contextCopy": "Copy",
    "dataEditor.contextPaste": "Paste",
    "dataEditor.contextDelete": "Delete",
    "dataEditor.contextInsertRowAbove": "Insert row above",
    "dataEditor.contextInsertRowBelow": "Insert row below",
    "dataEditor.contextInsertColLeft": "Insert column left",
    "dataEditor.contextInsertColRight": "Insert column right",
    "dataEditor.contextDeleteRow": "Delete row",
    "dataEditor.contextDeleteCol": "Delete column",

    // ExportDialog
    "export.title": "Export",
    "export.description": "Export your chart or project in various formats.",
    "export.pngImage": "PNG Image",
    "export.pngDescription": "High-resolution raster image (2x pixel ratio)",
    "export.download": "Download",
    "export.copied": "Copied",
    "export.copy": "Copy",
    "export.svgImage": "SVG Image",
    "export.svgDescription": "Scalable vector graphic format",
    "export.comingSoon": "Coming soon",
    "export.jsonConfig": "JSON Config",
    "export.jsonDescription": "Export the chart option object as JSON",
    "export.htmlStandalone": "HTML Standalone",
    "export.htmlDescription": "Self-contained HTML file with ECharts CDN",
    "export.projectFile": "Project File",
    "export.projectDescription": "Full project document including datasets, transforms, and chart configuration",
  },

  it: {
    // Toolbar
    "toolbar.appName": "ECharts Studio",
    "toolbar.newProject": "Nuovo Progetto",
    "toolbar.openProject": "Apri Progetto",
    "toolbar.save": "Salva",
    "toolbar.saveNoChanges": "Salva (nessuna modifica)",
    "toolbar.saveAs": "Salva con nome...",
    "toolbar.undo": "Annulla",
    "toolbar.redo": "Ripristina",
    "toolbar.toggleAdvancedMode": "Modalità avanzata",
    "toolbar.modeBasic": "Base",
    "toolbar.modeAdvanced": "Avanzata",
    "toolbar.switchToLightTheme": "Tema chiaro",
    "toolbar.switchToDarkTheme": "Tema scuro",
    "toolbar.exportChartAsImage": "Esporta grafico come immagine",
    "toolbar.commandPalette": "Palette Comandi (⌘K)",
    "toolbar.selectChartType": "Tipo di grafico",

    // Sidebar
    "sidebar.tabProject": "Progetto",
    "sidebar.tabData": "Dati",
    "sidebar.tabTemplates": "Modelli",
    "sidebar.templateAppliedDetached": "Modello applicato — grafico scollegato dal dataset",
    "sidebar.noProject": "Nessun progetto aperto.",
    "sidebar.noProjectHint": "Crea o apri un progetto per iniziare.",
    "sidebar.name": "Nome",
    "sidebar.projectNamePlaceholder": "Nome progetto",
    "sidebar.description": "Descrizione",
    "sidebar.descriptionPlaceholder": "Aggiungi una descrizione...",
    "sidebar.tags": "Tag",
    "sidebar.addTagPlaceholder": "Aggiungi tag...",
    "sidebar.removeTag": "Rimuovi tag",
    "sidebar.created": "Creato:",
    "sidebar.updated": "Aggiornato:",
    "sidebar.datasetsCount": "Dataset",
    "sidebar.new": "Nuovo",
    "sidebar.import": "Importa",
    "sidebar.noDatasets": "Nessun dataset.",
    "sidebar.noDatasetsHint": "Aggiungine uno per iniziare.",
    "sidebar.rowsColumns": "righe · colonne",
    "sidebar.chartTemplatesCount": "Modelli Grafici",
    "sidebar.inUse": "in uso",
    "sidebar.templateConfirmTitle": "Applicare questo modello?",
    "sidebar.templateConfirmDesc":
      "Sostituisce il grafico attuale e lo scollega dai dati. I dataset restano, ma la configurazione del grafico andrà persa.",
    "sidebar.templateConfirmCancel": "Annulla",
    "sidebar.templateConfirmApply": "Applica modello",

    // ChartStatusBar
    "chartStatus.source": "Fonte dati:",
    "chartStatus.editMapping": "Modifica mappatura",
    "chartStatus.detached": "Modello personalizzato — non collegato ad alcun dato",
    "chartStatus.reattach": "Collega ai dati",
    "chartStatus.empty": "Nessun dato collegato",
    "chartStatus.linkData": "Collega dati",
    "chartStatus.customizations": "{count} personalizzazioni",
    "chartStatus.reset": "Azzera",
    "chartStatus.resetTitle": "Azzerare le personalizzazioni?",
    "chartStatus.resetDesc":
      "Rimuove tutte le modifiche manuali e mostra il grafico esattamente come generato dai dati. Da qui non è annullabile (usa Annulla).",
    "chartStatus.reattachTitle": "Collegare il grafico ai dati?",
    "chartStatus.reattachDesc":
      "Il grafico verrà rigenerato dal primo dataset. Serie e assi manuali del modello saranno sostituiti dai dati.",
    "chartStatus.cancel": "Annulla",

    // BottomPanel
    "bottomPanel.tabJson": "JSON",
    "bottomPanel.tabData": "Dati",
    "bottomPanel.tabConsole": "Console",
    "bottomPanel.tabTransforms": "Trasformazioni",
    "bottomPanel.noConsoleOutput": "Nessun output in console",
    "bottomPanel.noProjectLoaded": "Nessun progetto caricato",
    "bottomPanel.transformPipeline": "Pipeline di trasformazione",
    "bottomPanel.comingSoon": "Disponibile a breve",

    // CommandPalette
    "commandPalette.ariaLabel": "Palette comandi",
    "commandPalette.searchPlaceholder": "Cerca comandi...",
    "commandPalette.noCommandsFound": "Nessun comando trovato.",
    "commandPalette.sectionFile": "File",
    "commandPalette.sectionView": "Visualizza",
    "commandPalette.sectionEdit": "Modifica",
    "commandPalette.sectionChart": "Grafico",
    "commandPalette.sectionHelp": "Aiuto",
    "commandPalette.newProject": "Nuovo Progetto",
    "commandPalette.newProjectDesc": "Crea un nuovo progetto vuoto",
    "commandPalette.openProject": "Apri Progetto",
    "commandPalette.openProjectDesc": "Apri un file di progetto esistente",
    "commandPalette.save": "Salva",
    "commandPalette.saveDesc": "Salva il progetto corrente",
    "commandPalette.saveAs": "Salva con nome",
    "commandPalette.saveAsDesc": "Salva il progetto in una nuova posizione",
    "commandPalette.exportPng": "Esporta PNG",
    "commandPalette.exportPngDesc": "Esporta il grafico come immagine PNG",
    "commandPalette.exportJson": "Esporta JSON",
    "commandPalette.exportJsonDesc": "Esporta la configurazione del grafico come JSON",
    "commandPalette.toggleSidebar": "Mostra/Nascondi Barra Laterale",
    "commandPalette.toggleSidebarDesc": "Mostra o nascondi la barra laterale sinistra",
    "commandPalette.toggleInspector": "Mostra/Nascondi Ispettore",
    "commandPalette.toggleInspectorDesc": "Mostra o nascondi il pannello ispettore destro",
    "commandPalette.toggleBottomPanel": "Mostra/Nascondi Pannello Inferiore",
    "commandPalette.toggleBottomPanelDesc": "Mostra o nascondi il pannello dati in basso",
    "commandPalette.toggleDarkLight": "Tema Chiaro/Scuro",
    "commandPalette.switchToLight": "Passa alla modalità chiara",
    "commandPalette.switchToDark": "Passa alla modalità scura",
    "commandPalette.toggleBasicAdvanced": "Modalità Base/Avanzata",
    "commandPalette.toggleBasicAdvancedDesc": "Passa tra modalità base e avanzata",
    "commandPalette.undo": "Annulla",
    "commandPalette.undoDesc": "Annulla l'ultima azione",
    "commandPalette.redo": "Ripristina",
    "commandPalette.redoDesc": "Ripristina l'ultima azione annullata",
    "commandPalette.barChart": "Grafico a Barre",
    "commandPalette.lineChart": "Grafico a Linee",
    "commandPalette.pieChart": "Grafico a Torta",
    "commandPalette.scatterChart": "Grafico a Dispersione",
    "commandPalette.radarChart": "Grafico Radar",
    "commandPalette.documentation": "Documentazione",
    "commandPalette.documentationDesc": "Apri la documentazione di ECharts",

    // ChartPreview
    "chartPreview.openOrCreate": "Apri o crea un progetto per iniziare",
    "chartPreview.failedRefresh": "Impossibile aggiornare il grafico",
    "chartPreview.failedExportPng": "Impossibile esportare PNG",
    "chartPreview.dismiss": "Chiudi",
    "chartPreview.refresh": "Aggiorna",
    "chartPreview.exitFullscreen": "Esci da schermo intero",
    "chartPreview.fullscreen": "Schermo intero",
    "chartPreview.exportAsPng": "Esporta come PNG",
    "chartPreview.comingSoon": "Disponibile a breve",
    "chartPreview.exportPngTitle": "Esporta PNG",
    "chartPreview.exportPngDesc": "Configura dimensione e risoluzione dell'immagine",
    "chartPreview.width": "Larghezza (px)",
    "chartPreview.height": "Altezza (px)",
    "chartPreview.dpi": "Risoluzione",
    "chartPreview.outputSize": "Dimensione output",
    "chartPreview.cancel": "Annulla",
    "chartPreview.export": "Esporta",
    "chartPreview.exporting": "Esportazione…",

    // PropertyInspector
    "inspector.noPropertiesFound": "Nessuna proprietà trovata",
    "inspector.tryDifferentSearch": "Prova con un termine diverso",
    "inspector.searchResultsCount": "risultati",
    "inspector.searchPropertiesPlaceholder": "Cerca proprietà...",
    "inspector.clearSearch": "Cerca proprietà...",
    "inspector.tabProperties": "Proprietà",
    "inspector.tabStructure": "Struttura",
    "inspector.resetAll": "Reimposta Tutto",
    "inspector.noOptionDefined": "Nessuna opzione definita",

    // PropertyField
    "propertyField.resetToDefault": "Reimposta al valore predefinito",
    "propertyField.selectPlaceholder": "Seleziona...",
    "propertyField.emptyOption": "(vuoto)",
    "propertyField.functionPlaceholder": "() => valore",

    // TreeView
    "treeView.collapse": "Comprimi",
    "treeView.expand": "Espandi",
    "treeView.itemsCount": "elementi",
    "treeView.keysCount": "chiavi",
    "treeView.emptyArray": "Array vuoto",
    "treeView.emptyObject": "Oggetto vuoto",

    // JsonEditor
    "jsonEditor.noProjectLoaded": "Nessun progetto caricato",
    "jsonEditor.formatJson": "Formatta JSON",
    "jsonEditor.copyToClipboard": "Copia negli appunti",
    "jsonEditor.showLineNumbers": "Mostra numeri di riga",
    "jsonEditor.hideLineNumbers": "Nascondi numeri di riga",
    "jsonEditor.lines": "Righe",
    "jsonEditor.jsonFormatted": "JSON formattato",
    "jsonEditor.cannotFormatInvalidJson": "Impossibile formattare: JSON non valido",
    "jsonEditor.copiedToClipboard": "Copiato negli appunti",
    "jsonEditor.failedToCopy": "Impossibile copiare",
    "jsonEditor.rootMustBeObject": "Il valore radice deve essere un oggetto JSON",
    "jsonEditor.detachedWarning": "Questa modifica scollega il grafico dal dataset",
    "jsonEditor.reattach": "Riaggancia al dataset",
    "jsonEditor.reattached": "Grafico riagganciato al dataset (modifiche manuali scartate)",

    // DataEditor
    "dataEditor.noProjectLoaded": "Nessun progetto caricato",
    "dataEditor.selectOrCreateDataset": "Seleziona un dataset o creane uno nuovo",
    "dataEditor.selectDatasetPlaceholder": "Seleziona dataset",
    "dataEditor.importCsv": "Importa CSV",
    "dataEditor.addRow": "Riga",
    "dataEditor.columnNamePlaceholder": "Nome colonna",
    "dataEditor.addCol": "Col",
    "dataEditor.invalidCells": "Celle non valide",
    "dataEditor.sortTooltip": "Ordina",
    "dataEditor.deleteColumnTooltip": "Elimina colonna",
    "dataEditor.sortedAsc": "↑ ordinato",
    "dataEditor.sortedDesc": "↓ ordinato",
    "dataEditor.deleteRowTooltip": "Elimina riga",
    "dataEditor.noRowsHint": "Nessuna riga. Clicca \"Riga\" per aggiungerne una.",
    "dataEditor.rowsColumnsFooter": "righe · colonne",
    "dataEditor.importedRows": "Importate righe da",
    "dataEditor.failedParseCsv": "Impossibile analizzare il file CSV",
    "dataEditor.bindingTitle": "Collega Dati al Grafico",
    "dataEditor.bindingSeries": "serie",
    "dataEditor.bindingEnable": "Collega al grafico",
    "dataEditor.bindingHint": "Collega questo dataset al grafico — le colonne diventano assi e serie.",
    "dataEditor.bindingDisable": "Scollega",
    "dataEditor.bindingSelectColumn": "Seleziona colonna",
    "dataEditor.bindingNamePlaceholder": "Etichetta",
    "dataEditor.bindingAddSeries": "Aggiungi serie",
    "dataEditor.bindingPieName": "Nome",
    "dataEditor.bindingPieValue": "Valore",
    "dataEditor.bindingAddIndicator": "Aggiungi indicatore",

    // Context menu
    "dataEditor.contextCut": "Taglia",
    "dataEditor.contextCopy": "Copia",
    "dataEditor.contextPaste": "Incolla",
    "dataEditor.contextDelete": "Elimina",
    "dataEditor.contextInsertRowAbove": "Inserisci riga sopra",
    "dataEditor.contextInsertRowBelow": "Inserisci riga sotto",
    "dataEditor.contextInsertColLeft": "Inserisci colonna a sinistra",
    "dataEditor.contextInsertColRight": "Inserisci colonna a destra",
    "dataEditor.contextDeleteRow": "Elimina riga",
    "dataEditor.contextDeleteCol": "Elimina colonna",

    // ExportDialog
    "export.title": "Esporta",
    "export.description": "Esporta il grafico o il progetto in vari formati.",
    "export.pngImage": "Immagine PNG",
    "export.pngDescription": "Immagine raster ad alta risoluzione (rapporto pixel 2x)",
    "export.download": "Scarica",
    "export.copied": "Copiato",
    "export.copy": "Copia",
    "export.svgImage": "Immagine SVG",
    "export.svgDescription": "Formato grafico vettoriale scalabile",
    "export.comingSoon": "Disponibile a breve",
    "export.jsonConfig": "Configurazione JSON",
    "export.jsonDescription": "Esporta l'oggetto opzioni del grafico come JSON",
    "export.htmlStandalone": "HTML Indipendente",
    "export.htmlDescription": "File HTML autonomo con CDN ECharts",
    "export.projectFile": "File Progetto",
    "export.projectDescription": "Documento completo del progetto con dataset, trasformazioni e configurazione grafico",
  },
};
