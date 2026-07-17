Voglio che tu progetti e implementi una applicazione desktop cross-platform basata su Tauri con frontend moderno e Apache ECharts come motore di rendering dei grafici.

Stack obbligatorio:
- Tauri per il contenitore desktop.
- Frontend obbligatoriamente in React + TypeScript.
- Styling obbligatoriamente con Tailwind CSS.
- Component library obbligatoria: shadcn/ui.
- Icone obbligatorie: Lucide React.
- Apache ECharts come motore charting principale.
- Preferisci Vite come tooling frontend.
- Il codice frontend deve essere organizzato con componenti riusabili, accessibili e ben separati.
- Tutta la UI deve essere coerente con un’app desktop professionale, non con un sito marketing.

Obiettivo prodotto:
Creare una vera GUI desktop per Apache ECharts, rivolta a utenti tecnici e semi-tecnici, che permetta di:
1. creare, modificare, visualizzare e organizzare grafici;
2. salvare i grafici in locale come progetto completo;
3. salvare insieme sia i dati sia tutta la configurazione ECharts;
4. modificare via interfaccia grafica qualsiasi opzione di configurazione ECharts esistente o futura;
5. esportare i grafici in formati comuni;
6. lavorare anche offline.

Vincoli architetturali:
- Usa Tauri per il contenitore desktop.
- Usa React + TypeScript per tutto il frontend.
- Usa Tailwind CSS come unico sistema di styling principale.
- Usa shadcn/ui per i componenti UI base: button, input, select, dialog, sheet, tabs, tooltip, popover, dropdown menu, accordion, scroll area, separator, table, form controls, toast, resizable panels, command palette dove utile.
- Usa Lucide React per tutte le icone dell’interfaccia.
- Usa Apache ECharts come motore charting principale.
- Organizza il codice in modo modulare, con separazione netta tra:
  - stato progetto,
  - dataset,
  - configurazione ECharts,
  - binding GUI <-> option object,
  - persistenza locale,
  - import/export,
  - preview/render live.
- Il design deve essere professionale, desktop-first, adatto a un editor complesso.
- L’app deve essere pensata per macOS come target primario, ma mantenere compatibilità cross-platform.

Vincoli UI obbligatori:
- L’interfaccia deve sembrare un vero strumento professionale desktop.
- Usa shadcn/ui in modo consistente, non solo nominale.
- Usa Lucide React per toolbar, sidebar, pannelli, stato, azioni, warning, search, save, export, dataset, chart types e inspector.
- Supporta dark mode e light mode.
- Supporta layout con pannelli ridimensionabili.
- Usa command palette stile editor professionale.
- Tipografia, spacing e hierarchy devono essere curate.
- Niente componenti grezzi o HTML “unstyled” se esiste una controparte shadcn appropriata.

Visione UX:
L’app deve ricordare un mix tra:
- editor visuale per dashboard,
- inspector stile Figma/Framer,
- property panel avanzato,
- data editor tabellare,
- JSON editor tecnico per utenti power-user.

Principio chiave:
Ogni proprietà configurabile di ECharts deve essere raggiungibile dalla GUI.
Dove una proprietà è difficile da rappresentare in UI, deve esistere comunque un fallback potente:
- property inspector generico,
- form schema dinamico,
- JSON editor sincronizzato,
- search globale tra opzioni.

Requisito fondamentale:
La GUI non deve limitarsi a un set ridotto di grafici predefiniti.
Deve essere un editor generale di option object ECharts.

Funzionalità principali richieste

A. Gestione progetto
- Crea nuovo progetto.
- Apri progetto esistente.
- Salva.
- Salva con nome.
- Autosave locale.
- Lista recenti.
- Duplica progetto.
- Elimina progetto.
- Importa/esporta progetto come file singolo.
- Gestisci metadati progetto: nome, descrizione, tags, data creazione, data modifica, versione schema.

B. Persistenza locale
Implementa salvataggio locale robusto.
Ogni progetto deve contenere almeno:
- metadata progetto;
- uno o più dataset;
- trasformazioni dati;
- option object ECharts completo;
- stato UI facoltativo (layout pannelli, pannelli aperti, ultimo tab attivo, nodo inspector selezionato).
Usa filesystem locale tramite Tauri.
Prevedi formato progetto leggibile e versionabile, ad esempio:
- cartella progetto con manifest.json + datasets + assets
oppure
- file singolo .echarts-project / .json / .zip.
Definisci una strategia di versionamento schema per migrazioni future.

C. Editor dati
Serve un editor dati integrato, non solo configurazione.
Funzioni minime:
- inserimento manuale dati in tabella;
- import CSV;
- import JSON;
- import TSV;
- incolla da clipboard stile spreadsheet;
- rinomina colonne;
- cambio tipo colonna;
- parsing numeri/date;
- ordinamento e filtri;
- anteprima dati;
- validazione errori;
- supporto dataset multipli;
- mappatura dataset -> serie.
Se possibile, supporta anche dataset ECharts nativo e transform pipeline.

D. Builder visuale dei grafici
Deve esistere un livello “easy mode” sopra ECharts:
- scelta chart type iniziale;
- binding guidato tra colonne dati e assi/serie;
- configurazione visuale di:
  - title,
  - subtitle,
  - legend,
  - tooltip,
  - xAxis,
  - yAxis,
  - grid,
  - series,
  - labels,
  - colors,
  - theme,
  - toolbox,
  - dataZoom,
  - animation,
  - markLine,
  - markPoint,
  - markArea.
Supporta almeno i tipi principali:
- line,
- bar,
- area,
- pie,
- scatter,
- radar,
- heatmap,
- gauge,
- funnel,
- candlestick,
- treemap,
- sunburst,
- map se possibile,
- graph/network se possibile.
Il builder iniziale deve generare option object validi e ben strutturati.

E. Inspector avanzato ECharts
Questo è il cuore del prodotto.
Crea un property inspector universale che consenta di modificare qualsiasi nodo dell’option object.
Deve includere:
- tree view della struttura option;
- form dinamica basata sul path della proprietà;
- campi type-aware:
  - string,
  - number,
  - boolean,
  - enum,
  - color,
  - array,
  - object,
  - rich text object,
  - callback/function template ove applicabile;
- ricerca per nome proprietà;
- ricerca per path;
- breadcrumb del path corrente;
- possibilità di aggiungere/rimuovere nodi;
- reset al valore di default;
- comparazione tra valore corrente e default;
- help contestuale e descrizione proprietà.
La GUI deve essere guidata da uno schema interno delle opzioni ECharts.
Se non esiste uno schema completo ufficiale consumabile direttamente, costruisci un layer astratto interno che permetta di rappresentare:
- label,
- descrizione,
- tipo,
- default noto,
- esempi,
- regole di visibilità condizionale,
- relazioni tra campi.
Prevedi che questo schema sia estendibile.

F. Modalità duale: Visual + JSON
L’utente deve poter passare in ogni momento tra:
- editor visuale,
- editor strutturato,
- editor JSON raw.
Il JSON editor deve essere:
- bidirezionale,
- sincronizzato in tempo reale con la GUI,
- validato,
- con linting e messaggi errore chiari.
Quando il JSON viene modificato manualmente, la GUI deve riflettere i cambiamenti compatibili.

G. Rendering live
- Preview del grafico in tempo reale.
- Aggiornamento immediato quando cambiano dati o opzioni.
- Gestione errori di rendering non distruttiva.
- Pannello errori e warning.
- Possibilità di mostrare side-by-side:
  - grafico,
  - option JSON,
  - dataset.
- Supporta resize, tema light/dark, DPR corretto, export ad alta qualità.

H. Export
Implementa export di:
- PNG,
- SVG se supportato,
- JSON config,
- progetto completo,
- HTML standalone opzionale che includa ECharts e renda il grafico esportabile/shareable.
L’export deve preservare fedelmente il risultato visivo.

I. Theming e preset
- Tema chiaro/scuro.
- Preset colori.
- Preset chart templates.
- Template iniziali per casi comuni:
  - vendite mensili,
  - serie temporali,
  - distribuzioni,
  - confronto categorie,
  - dashboard KPI semplice.
- Possibilità di salvare preset personalizzati.

J. Estendibilità
Progetta il sistema in modo che in futuro possa supportare:
- plugin;
- custom series;
- themes custom;
- snippets riutilizzabili;
- libreria template;
- import da API/URL;
- binding a database locali;
- AI assistant per generare option e mapping.

Requisiti UI/UX
- Layout desktop con sidebar sinistra per progetto/dataset/serie.
- Canvas centrale con preview grafico.
- Inspector a destra con tabs contestuali.
- Toolbar superiore con comandi principali.
- Bottom panel opzionale per errori, logs, JSON raw, transform preview.
- Drag and drop ragionato dove utile.
- Ricerca globale comandi stile command palette.
- Keyboard shortcuts per salvataggio, undo/redo, ricerca, pannelli.
- Undo/redo robusto a livello di stato editor.
- UX chiara per distinguere:
  - dati,
  - mapping,
  - stile,
  - struttura ECharts avanzata.

Componenti UI desiderati con shadcn/ui
Usa esplicitamente questi componenti dove appropriato:
- Button
- Input
- Textarea
- Label
- Select
- Checkbox
- Switch
- Radio Group
- Slider
- Tabs
- Accordion
- Collapsible
- Popover
- Tooltip
- Hover Card
- Dialog
- Alert Dialog
- Dropdown Menu
- Context Menu
- Sheet
- Separator
- Scroll Area
- Resizable Panels
- Table
- Badge
- Card
- Command
- Toast / Sonner
- Breadcrumb
- Form primitives
- Skeleton
- Menubar se utile per la desktop shell

Libreria icone
Usa Lucide React per:
- file actions,
- save/open/export,
- chart categories,
- data sources,
- panels,
- search,
- settings,
- theme toggle,
- warnings/errors,
- tree expand/collapse,
- add/remove/reset actions.

Requisiti tecnici profondi
1. Definisci una struttura di stato centrale tipizzata.
2. Definisci un modello ProjectDocument versionato.
3. Definisci adapter tra GUI e option object ECharts.
4. Definisci un registry delle proprietà editabili.
5. Definisci una strategia per mantenere sincronizzati:
   - UI form,
   - tree option,
   - JSON raw editor,
   - preview chart.
6. Definisci una strategia per serializzare callback o formatter:
   - o vietandoli in safe mode,
   - o supportandoli come stringhe/template con sandboxing chiaro.
7. Evita corruzione dei progetti in caso di crash: usa scrittura atomica dove possibile.
8. Prevedi migration layer tra versioni schema.
9. Inserisci test per parser, persistenza e sync editor <-> JSON.
10. Considera performance su option object grandi e dataset corposi.

Requisiti sul modello dati del progetto
Proponi un formato esplicito, ad esempio:

ProjectDocument {
  id: string
  version: string
  metadata: {
    name: string
    description?: string
    createdAt: string
    updatedAt: string
    tags: string[]
  }
  datasets: DatasetDocument[]
  transforms: TransformDocument[]
  chart: {
    option: EChartsOption
    theme?: string
    renderer?: "canvas" | "svg"
  }
  uiState?: {
    panels: ...
    selectedNodePath: ...
    lastOpenTab: ...
  }
  assets?: AssetRef[]
}

Devi però migliorarlo e renderlo production-grade.

Requisiti sul property system
Voglio un sistema schema-driven.
Per ogni proprietà ECharts, il sistema deve poter definire:
- key/path;
- label user-friendly;
- descrizione;
- categoria;
- tipo input;
- validator;
- default;
- dipendenze da altre proprietà;
- visibilità condizionale;
- esempi.
Esempi:
- series[i].lineStyle.width -> number input;
- title.text -> text input;
- tooltip.trigger -> enum;
- color -> array editor;
- xAxis.axisLabel.rotate -> number slider/input;
- visualMap -> object editor complesso.
Questo deve permettere alla GUI di crescere senza hardcodare tutto a mano.

Safe mode e advanced mode
Prevedi due modalità:
- Basic mode: mostra solo i controlli più comuni e sicuri.
- Advanced mode: mostra tutta la profondità dello schema ECharts.
In ogni momento deve esserci un pulsante “Apri in JSON” o equivalente.

JSON editor
Usa un editor serio, tipo Monaco o equivalente.
Richieste:
- syntax highlight;
- folding;
- validation;
- path jump dal pannello GUI al JSON;
- path jump dal JSON al nodo GUI quando possibile.

Import dati e mapping
Implementa un wizard iniziale:
- scegli sorgente dati;
- importa file;
- riconosci colonne;
- suggerisci tipo grafico;
- suggerisci mapping colonne -> assi/serie;
- genera grafico iniziale;
- poi lascia pieno controllo all’utente.

Export HTML standalone
Questa funzione è molto importante.
L’utente deve poter esportare un file HTML standalone che:
- includa i dati;
- includa option;
- carichi ECharts;
- replichi il grafico in un browser;
- opzionalmente sia leggibile e modificabile.
Se possibile, offri due varianti:
- HTML embed pulito;
- HTML debug con option leggibile.

Funzionalità extra utili
- Libreria esempi iniziali.
- Cronologia snapshot del progetto.
- Duplicate chart as variation.
- Diff tra due versioni di option.
- Inspector responsive per proprietà annidate profonde.
- Search “show me all animation-related options”.
- Search “show me all label-related options”.
- Preset palette accessibili.
- Verifica base di contrasto e leggibilità per label/tooltip.

Requisiti estetici
- UI elegante, scura o neutra, molto curata.
- Sensazione da tool pro.
- Nessuna UI giocattolo.
- Grande attenzione a tipografia, spaziatura, leggibilità e gerarchia.
- Ottima usabilità su schermi laptop.
- Supporto dark/light.
- Componenti coerenti.
- Preview chart protagonista, inspector potente ma non opprimente.

Output che voglio da te
Non limitarti a descrivere l’idea.
Voglio che tu produca:
1. architettura completa dell’app;
2. struttura cartelle;
3. scelta stack motivata;
4. schema dati progetto;
5. schema del property registry;
6. flusso stato e sincronizzazione;
7. wireframe testuale delle principali schermate;
8. piano implementativo per milestone;
9. codice iniziale del progetto;
10. codice funzionante per:
   - shell Tauri,
   - frontend React/TypeScript,
   - integrazione ECharts,
   - editor stato progetto,
   - salvataggio locale di un progetto,
   - apertura progetto,
   - preview live,
   - inspector iniziale,
   - editor JSON sincronizzato.
11. esempi di almeno 2 template grafico pronti.
12. strategia per evolvere il supporto verso “tutte le opzioni ECharts”.

Vincoli di qualità
- Codice pulito, tipizzato, production-minded.
- Nessuna scorciatoia demo-only se evitabile.
- Commenti solo dove servono davvero.
- Moduli ben separati.
- Nessun accoppiamento inutile.
- Evita hardcode fragile.
- Gestisci edge case realistici.
- Scrivi come se dovessi davvero mantenere il progetto.

Prima di generare il codice:
- esplicita le decisioni architetturali;
- elenca rischi e tradeoff;
- proponi una MVP forte;
- poi implementa la base con file completi.

Priorità assolute:
1. persistenza locale robusta;
2. sincronizzazione GUI / option JSON / preview;
3. property inspector estendibile;
4. supporto reale a ECharts, non mock;
5. base software seria e scalabile.

Nome progetto suggerito:
EChart Studio Desktop
oppure
EChart Forge
oppure
ECharts Workbench

Genera un risultato concreto e implementabile, non solo un concept.