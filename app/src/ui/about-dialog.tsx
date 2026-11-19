// About (app-shell §9): what the app does, who made it, version and licence, source and changelog
// links, and the open-source packages it ships (scripts/credits.ts → __CREDITS__, build time) with a link
// to their full licence texts (third-party-licenses.txt, scripts/licenses.ts).
import { app } from "../config";
import { appText, t } from "../i18n";
import { ShellDialog } from "./shell-dialog";
import type { ShellDialogId } from "./use-shell-dialog";

/** Props of {@link AboutDialog}. */
export interface AboutDialogProps {
  readonly onClose: () => void;
  readonly opener: HTMLElement | null;
  /** Opens What's new from the version line. */
  readonly openDialog: (id: ShellDialogId) => void;
}

/** Renders the open About dialog. */
export function AboutDialog({ onClose, opener, openDialog }: AboutDialogProps): React.JSX.Element {
  return (
    <ShellDialog title={t("shell.about.title", { name: app.name })} onClose={onClose} opener={opener}>
      <div className="prose">
        <p>{appText().description}</p>
        <p>
          {t("shell.about.builtBy", { author: app.author.name })}{" "}
          <a href={app.author.github} target="_blank" rel="noopener noreferrer">{t("shell.about.github")}</a>
          {" · "}
          <a href={app.shell.buyMeACoffee} target="_blank" rel="noopener noreferrer">{t("shell.menu.items.support")}</a>
        </p>
        <p className="text-text-secondary">{t("shell.about.version", { version: app.version })}</p>
        {/* Links in their own row are 44 px targets (accessibility §1); links inside sentences stay inline. */}
        <p className="link-row">
          <a className="text-button" href={app.repo} target="_blank" rel="noopener noreferrer">{t("shell.menu.items.source")}</a>
          <button type="button" className="text-button" onClick={() => { openDialog("whats-new"); }}>{t("shell.menu.items.whats-new")}</button>
        </p>
        <h3>{t("shell.about.credits")}</h3>
        <ul className="text-text-secondary">
          {__CREDITS__.map((credit) => (
            <li key={credit.name}>
              <a href={credit.url} target="_blank" rel="noopener noreferrer">{credit.name}</a> · {credit.license}
            </li>
          ))}
        </ul>
        {/* Full licence texts: MIT, Apache-2.0 and OFL require them with every copy (legal-pages §5). */}
        <a className="text-button" href="./third-party-licenses.txt">{t("shell.about.licenses")}</a>
      </div>
    </ShellDialog>
  );
}
