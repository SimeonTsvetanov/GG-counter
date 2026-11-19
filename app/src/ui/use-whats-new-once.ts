// Shows What's new once after an update (app-shell §5): a first visit only records the version; a
// later start with another version opens the dialog (which records it as seen).
import { useEffect } from "react";
import { app } from "../config";
import { readLastSeenVersion, writeLastSeenVersion } from "../storage/prefs";
import type { ShellDialogId } from "./use-shell-dialog";

/** Opens What's new on the first start after the app's version changed. */
export function useWhatsNewOnce(openDialog: (id: ShellDialogId) => void): void {
  useEffect(() => {
    const seen = readLastSeenVersion();
    if (seen === null) writeLastSeenVersion(app.version);
    else if (seen !== app.version) openDialog("whats-new");
  }, [openDialog]);
}
