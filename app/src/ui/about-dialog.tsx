// About (app-shell §9): what the app does, who made it, version and licence, source and changelog
// links, and the open-source packages it ships (scripts/credits.ts → __CREDITS__, build time).
import { app } from "../config";
import { t } from "../i18n";
import { ShellDialog } from "./shell-dialog";
import type { ShellDialogId } from "./use-shell-dialog";

/** Props of {@link AboutDialog}. */
export interface AboutDialogProps {
  readonly onClose: () => void;
  readonly opener: HTMLElement | null;
  /** Opens What's new from the version line. */
  readonly openDialog: (id: ShellDialogId) => void;
}

/** Links in their own row are 44 px tall (target size, accessibility §1). */
const LINK_CLASS = "inline-flex min-h-11 items-center text-primary underline-offset-4 hover:underline";

/** Renders the open About dialog. */
export function AboutDialog({ onClose, opener, openDialog }: AboutDialogProps): React.JSX.Element {
  return (
    <ShellDialog title={t("shell.about.title", { name: app.name })} onClose={onClose} opener={opener}>
      <div className="space-y-3 text-sm">
        <p>{app.description}</p>
        <p>
          {t("shell.about.builtBy", { author: app.author.name })}{" "}
          <a className={LINK_CLASS} href={app.author.github} target="_blank" rel="noopener noreferrer">{t("shell.about.github")}</a>
          {" · "}
          <a className={LINK_CLASS} href={app.shell.buyMeACoffee} target="_blank" rel="noopener noreferrer">{t("shell.menu.items.support")}</a>
        </p>
        <p className="text-muted-foreground">{t("shell.about.version", { version: app.version })}</p>
        <p className="flex flex-wrap gap-x-6">
          <a className={LINK_CLASS} href={app.repo} target="_blank" rel="noopener noreferrer">{t("shell.menu.items.source")}</a>
          <button type="button" className={LINK_CLASS} onClick={() => { openDialog("whats-new"); }}>{t("shell.menu.items.whats-new")}</button>
        </p>
        <h3 className="pt-2 font-semibold">{t("shell.about.credits")}</h3>
        <ul className="space-y-1 text-muted-foreground">
          {__CREDITS__.map((credit) => (
            <li key={credit.name}>
              <a className={LINK_CLASS} href={credit.url} target="_blank" rel="noopener noreferrer">{credit.name}</a> · {credit.license}
            </li>
          ))}
        </ul>
      </div>
    </ShellDialog>
  );
}
