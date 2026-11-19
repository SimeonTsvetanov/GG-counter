// Settings (app-shell §4): Theme, Language (PLAN T-09), Your data (export / import) and Delete (Clear
// my data), as iOS-style grouped sections (ui-patterns §12). Loaded on demand from the menu (React.lazy in shell-dialogs.tsx).
import { t } from "../i18n";
import { DataPanel, type DataPanelProps } from "./data-panel";
import { LanguageChoice } from "./language-choice";
import { ShellDialog } from "./shell-dialog";
import { ThemeChoice } from "./theme-choice";

/** Props of {@link SettingsDialog}. */
export interface SettingsDialogProps extends DataPanelProps {
  readonly onClose: () => void;
  readonly opener: HTMLElement | null;
}

/** Renders the open Settings dialog. */
export function SettingsDialog({ onClose, opener, onImported, onCleared }: SettingsDialogProps): React.JSX.Element {
  return (
    <ShellDialog title={t("shell.settings.title")} onClose={onClose} opener={opener}>
      <section aria-labelledby="settings-theme" className="group">
        <h3 id="settings-theme" className="group-title">{t("shell.theme.label")}</h3>
        <ThemeChoice />
      </section>
      <section aria-labelledby="settings-language" className="group">
        <h3 id="settings-language" className="group-title">{t("shell.language.label")}</h3>
        <LanguageChoice />
      </section>
      <DataPanel onImported={onImported} onCleared={onCleared} />
    </ShellDialog>
  );
}
