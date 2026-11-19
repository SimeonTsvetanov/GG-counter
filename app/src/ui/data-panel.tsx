// Settings → Your data (app-shell §4, engineering → browser-storage §7): export to a file, import from
// a file (checked through core before anything is asked or changed; confirmed before the game is
// replaced) and Clear my data (confirmed; only this app's keys). All through app/src/storage.
import { useRef, useState } from "react";
import { Button } from "../components/ui/button";
import { app } from "../config";
import { t } from "../i18n";
import { MAX_IMPORT_CHARS, checkImport, clearData, importData, type AppData, type ImportErrorCode } from "../storage";
import { ConfirmDialog, type Confirmation } from "./confirm-dialog";
import { downloadExport } from "./download-export";
import { useToast } from "./toast";

/** Props of {@link DataPanel}. */
export interface DataPanelProps {
  /** Shows the imported game and theme on screen (already saved by the storage module). */
  readonly onImported: (data: AppData) => void;
  /** Resets the screen after Clear my data, so nothing old is saved again. */
  readonly onCleared: () => void;
}

/** UTF-8 uses at most 4 bytes per character: a bigger file cannot be within the import limit. */
const MAX_IMPORT_BYTES = MAX_IMPORT_CHARS * 4;

/** Why an import was refused, in words; READ_FAILED = the browser could not read the file. */
function importErrorText(code: ImportErrorCode | "READ_FAILED"): string {
  return t(`shell.settings.importErrors.${code}`, { name: app.name });
}

/** Reads a picked file's text, or why it cannot be imported. */
async function readImportFile(file: File): Promise<{ ok: true; text: string } | { ok: false; code: "IMPORT_TOO_BIG" | "READ_FAILED" }> {
  if (file.size > MAX_IMPORT_BYTES) return { ok: false, code: "IMPORT_TOO_BIG" };
  try {
    return { ok: true, text: await file.text() };
  } catch {
    // because a file removed or locked after picking cannot be read; the message says to try again
    return { ok: false, code: "READ_FAILED" };
  }
}

/** Renders the export, import and delete actions with their status line and confirmations. */
export function DataPanel({ onImported, onCleared }: DataPanelProps): React.JSX.Element {
  const showToast = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);

  const askToImport = async (file: File): Promise<void> => {
    setError(null);
    const read = await readImportFile(file);
    if (!read.ok) {
      setError(importErrorText(read.code));
      return;
    }
    const checked = checkImport(read.text);
    if (!checked.ok) {
      setError(importErrorText(checked.error.code));
      return;
    }
    const count = checked.value.state.players.length;
    setConfirmation({
      title: t("shell.settings.importTitle"),
      message: t("shell.settings.importMessage", { file: file.name, count }),
      confirm: t("shell.settings.importConfirm"),
      onConfirm: () => {
        const imported = importData(read.text);
        if (!imported.ok) {
          setError(importErrorText(imported.error.code));
          return;
        }
        onImported(imported.value);
        showToast({ message: t("shell.settings.imported", { count }) });
      },
    });
  };

  const askToClear = (): void => {
    setError(null);
    setConfirmation({
      title: t("shell.settings.clearTitle"),
      message: t("shell.settings.clearMessage", { name: app.name }),
      confirm: t("shell.settings.clearConfirm"),
      onConfirm: () => {
        const cleared = clearData();
        onCleared();
        showToast({ message: cleared.ok ? t("shell.settings.cleared") : t("shell.settings.clearFailed", { name: app.name }) });
      },
    });
  };

  return (
    <>
      <section aria-labelledby="settings-data" className="space-y-2">
        <h3 id="settings-data" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("shell.settings.data")}</h3>
        <div className="grid gap-2 rounded-lg bg-muted/50 p-3 sm:grid-cols-2">
          <Button variant="secondary" onClick={() => { showToast({ message: t("shell.settings.exported", { file: downloadExport() }) }); }}>
            {t("shell.settings.export")}
          </Button>
          <Button variant="secondary" onClick={() => { fileInput.current?.click(); }}>
            {t("shell.settings.import")}
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void askToImport(file);
            }}
          />
        </div>
        <p role="alert" className="text-sm text-destructive">{error}</p>
        <p className="text-xs text-muted-foreground">{t("shell.settings.dataNote")}</p>
      </section>
      <section aria-labelledby="settings-danger" className="space-y-2">
        <h3 id="settings-danger" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("shell.settings.danger")}</h3>
        <Button variant="destructive" className="w-full" onClick={askToClear}>{t("shell.settings.clear")}</Button>
      </section>
      <ConfirmDialog confirmation={confirmation} onDone={() => { setConfirmation(null); }} />
    </>
  );
}
