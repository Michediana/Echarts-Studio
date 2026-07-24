import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { getVersion } from "@tauri-apps/api/app";
import { toast } from "sonner";

type Translate = (key: string, params?: Record<string, string | number>) => string;

interface RunUpdateCheckOptions {
  /**
   * Silent runs (the check on startup) stay quiet unless an update is actually
   * installing: a failed check or an up-to-date app must not interrupt anyone.
   * The manual button is verbose, otherwise clicking it looks like a no-op.
   */
  silent: boolean;
  t: Translate;
}

/**
 * Looks for an update and, when one exists, downloads it and restarts the app.
 * Never throws: callers treat a failed check as "no update available".
 */
export async function runUpdateCheck({ silent, t }: RunUpdateCheckOptions): Promise<void> {
  let checkingToast: string | number | undefined;

  try {
    if (!silent) {
      checkingToast = toast.loading(t("updater.checking"));
    }

    const update = await check();

    if (!update) {
      if (!silent) {
        const current = await getVersion();
        toast.success(t("updater.upToDate", { version: current }), { id: checkingToast });
      }
      return;
    }

    // From here on both flows are verbose: the app is about to restart itself,
    // so it has to say so no matter how the check was triggered.
    const downloadToast = toast.loading(t("updater.downloading", { version: update.version }), {
      id: checkingToast,
      duration: Infinity,
    });

    let downloaded = 0;
    let contentLength = 0;

    await update.downloadAndInstall((event) => {
      switch (event.event) {
        case "Started":
          contentLength = event.data.contentLength ?? 0;
          break;
        case "Progress": {
          downloaded += event.data.chunkLength;
          if (contentLength > 0) {
            const percent = Math.round((downloaded / contentLength) * 100);
            toast.loading(t("updater.downloadingProgress", { version: update.version, percent }), {
              id: downloadToast,
              duration: Infinity,
            });
          }
          break;
        }
        case "Finished":
          toast.loading(t("updater.installing"), { id: downloadToast, duration: Infinity });
          break;
      }
    });

    toast.success(t("updater.restarting"), { id: downloadToast, duration: Infinity });
    await relaunch();
  } catch (err) {
    console.error("Update check failed:", err);
    if (!silent) {
      toast.error(t("updater.failed"), {
        id: checkingToast,
        description: err instanceof Error ? err.message : String(err),
      });
    }
  }
}
