// Saves the app's data as a file (Settings → Export my data and the error screen): the storage
// module's export object as pretty JSON, downloaded as gg-counter-data-YYYY-MM-DD.json.
import { app } from "../config";
import { exportData } from "../storage";

/** Returns the export file name for `now`. */
export function exportFileName(now: Date = new Date()): string {
  return `${app.id}-data-${now.toISOString().slice(0, 10)}.json`;
}

/**
 * Downloads this app's data as a JSON file.
 *
 * @returns The file name, for the "Saved … ✓" message.
 */
export function downloadExport(now: Date = new Date()): string {
  const fileName = exportFileName(now);
  const blob = new Blob([`${JSON.stringify(exportData(now.toISOString()), null, 2)}\n`], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  // because revoking at once can cancel the download in some browsers; a minute is plenty
  window.setTimeout(() => { URL.revokeObjectURL(link.href); }, 60_000);
  return fileName;
}
