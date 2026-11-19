// Starts the service worker (app/src/ui/pwa.ts) once and turns its events into toasts: the pinned
// "New version available — Reload" offer and "Ready to work offline ✓" after the first install.
import { useEffect } from "react";
import { t } from "../i18n";
import { initPwa } from "./pwa";
import type { ShowToast } from "./toast";

/** True once the service worker was registered in this page (StrictMode runs effects twice). */
let isStarted = false;

/** Registers the service worker on mount and shows its update and offline-ready toasts. */
export function usePwaUpdates(showToast: ShowToast): void {
  useEffect(() => {
    if (isStarted) return;
    isStarted = true;
    initPwa({
      onUpdateReady: (reload) => {
        showToast({ message: t("shell.update.available"), action: { label: t("shell.update.reload"), run: reload }, pinned: true });
      },
      onOfflineReady: () => {
        showToast({ message: t("shell.update.offlineReady") });
      },
    });
  }, [showToast]);
}
