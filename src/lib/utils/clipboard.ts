/**
 * Clipboard helpers for the desktop app.
 *
 * On macOS the app runs inside WKWebView, where `navigator.clipboard.readText()`
 * is frequently blocked. The Tauri `clipboard-manager` plugin reads/writes the
 * OS clipboard natively from Rust and bypasses those webview restrictions, so we
 * prefer it and fall back to the web API only when the plugin is unavailable
 * (e.g. running the frontend in a plain browser during development).
 */

/** Write plain text to the system clipboard. Never throws. */
export async function writeClipboardText(text: string): Promise<void> {
  try {
    const { writeText } = await import("@tauri-apps/plugin-clipboard-manager");
    await writeText(text);
    return;
  } catch {
    // Not running under Tauri (or plugin missing) – fall back to the web API.
  }
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // System clipboard unavailable – caller keeps its internal clipboard copy.
  }
}

/** Read plain text from the system clipboard. Returns null when unavailable. */
export async function readClipboardText(): Promise<string | null> {
  try {
    const { readText } = await import("@tauri-apps/plugin-clipboard-manager");
    const text = await readText();
    return text ?? null;
  } catch {
    // Not running under Tauri (or plugin missing) – fall back to the web API.
  }
  try {
    const text = await navigator.clipboard.readText();
    return text ?? null;
  } catch {
    return null;
  }
}
