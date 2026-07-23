//! Menù applicativo nativo localizzato.
//!
//! Tauri, quando non gli si passa un menù, ne genera uno di default con le
//! etichette scritte in inglese e non le traduce in base alla lingua di
//! sistema. Qui costruiamo il menù a mano leggendo la lingua del sistema
//! operativo, così da mostrarlo in italiano quando serve.

use sys_locale::get_locale;
use tauri::{
    menu::{AboutMetadata, Menu, MenuBuilder, PredefinedMenuItem, SubmenuBuilder},
    AppHandle, Runtime,
};

/// Insieme di etichette per una lingua.
struct Labels {
    // App menu
    about: &'static str,
    services: &'static str,
    hide: &'static str,
    hide_others: &'static str,
    show_all: &'static str,
    quit: &'static str,
    // File
    file: &'static str,
    close: &'static str,
    // Edit
    edit: &'static str,
    undo: &'static str,
    redo: &'static str,
    cut: &'static str,
    copy: &'static str,
    paste: &'static str,
    select_all: &'static str,
    // View
    view: &'static str,
    fullscreen: &'static str,
    // Window
    window: &'static str,
    minimize: &'static str,
    zoom: &'static str,
}

const IT: Labels = Labels {
    about: "Informazioni su ECharts Studio",
    services: "Servizi",
    hide: "Nascondi ECharts Studio",
    hide_others: "Nascondi altre",
    show_all: "Mostra tutte",
    quit: "Esci da ECharts Studio",
    file: "File",
    close: "Chiudi finestra",
    edit: "Modifica",
    undo: "Annulla",
    redo: "Ripristina",
    cut: "Taglia",
    copy: "Copia",
    paste: "Incolla",
    select_all: "Seleziona tutto",
    view: "Vista",
    fullscreen: "Schermo intero",
    window: "Finestra",
    minimize: "Riduci a icona",
    zoom: "Ingrandisci",
};

const EN: Labels = Labels {
    about: "About ECharts Studio",
    services: "Services",
    hide: "Hide ECharts Studio",
    hide_others: "Hide Others",
    show_all: "Show All",
    quit: "Quit ECharts Studio",
    file: "File",
    close: "Close Window",
    edit: "Edit",
    undo: "Undo",
    redo: "Redo",
    cut: "Cut",
    copy: "Copy",
    paste: "Paste",
    select_all: "Select All",
    view: "View",
    fullscreen: "Toggle Fullscreen",
    window: "Window",
    minimize: "Minimize",
    zoom: "Zoom",
};

/// Sceglie il set di etichette in base alla lingua di sistema.
fn labels_for_system() -> &'static Labels {
    let locale = get_locale().unwrap_or_default().to_lowercase();
    if locale.starts_with("it") {
        &IT
    } else {
        &EN
    }
}

/// Costruisce il menù applicativo localizzato.
pub fn build<R: Runtime>(app: &AppHandle<R>) -> tauri::Result<Menu<R>> {
    let l = labels_for_system();

    // Su macOS il primo sottomenù diventa il menù applicazione (col nome app).
    #[cfg(target_os = "macos")]
    let app_menu = SubmenuBuilder::new(app, "ECharts Studio")
        .item(&PredefinedMenuItem::about(
            app,
            Some(l.about),
            Some(AboutMetadata::default()),
        )?)
        .separator()
        .item(&PredefinedMenuItem::services(app, Some(l.services))?)
        .separator()
        .item(&PredefinedMenuItem::hide(app, Some(l.hide))?)
        .item(&PredefinedMenuItem::hide_others(app, Some(l.hide_others))?)
        .item(&PredefinedMenuItem::show_all(app, Some(l.show_all))?)
        .separator()
        .item(&PredefinedMenuItem::quit(app, Some(l.quit))?)
        .build()?;

    let file_menu = {
        let mut b = SubmenuBuilder::new(app, l.file);
        b = b.item(&PredefinedMenuItem::close_window(app, Some(l.close))?);
        // Su Windows/Linux l'uscita sta nel menù File.
        #[cfg(not(target_os = "macos"))]
        {
            b = b
                .separator()
                .item(&PredefinedMenuItem::quit(app, Some(l.quit))?);
        }
        b.build()?
    };

    let edit_menu = SubmenuBuilder::new(app, l.edit)
        .item(&PredefinedMenuItem::undo(app, Some(l.undo))?)
        .item(&PredefinedMenuItem::redo(app, Some(l.redo))?)
        .separator()
        .item(&PredefinedMenuItem::cut(app, Some(l.cut))?)
        .item(&PredefinedMenuItem::copy(app, Some(l.copy))?)
        .item(&PredefinedMenuItem::paste(app, Some(l.paste))?)
        .item(&PredefinedMenuItem::select_all(app, Some(l.select_all))?)
        .build()?;

    let view_menu = SubmenuBuilder::new(app, l.view)
        .item(&PredefinedMenuItem::fullscreen(app, Some(l.fullscreen))?)
        .build()?;

    let window_menu = SubmenuBuilder::new(app, l.window)
        .item(&PredefinedMenuItem::minimize(app, Some(l.minimize))?)
        .item(&PredefinedMenuItem::maximize(app, Some(l.zoom))?)
        .separator()
        .item(&PredefinedMenuItem::close_window(app, Some(l.close))?)
        .build()?;

    let mut menu = MenuBuilder::new(app);
    #[cfg(target_os = "macos")]
    {
        menu = menu.item(&app_menu);
    }
    menu = menu
        .item(&file_menu)
        .item(&edit_menu)
        .item(&view_menu)
        .item(&window_menu);

    menu.build()
}
