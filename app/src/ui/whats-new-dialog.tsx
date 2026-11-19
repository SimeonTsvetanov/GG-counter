// What's new (app-shell §5): the last versions of CHANGELOG.md with their user-facing lines, read at
// build time (scripts/changelog.ts → __CHANGELOG__). Opening it marks this version as seen.
import { useEffect } from "react";
import { app } from "../config";
import { t } from "../i18n";
import { writeLastSeenVersion } from "../storage/prefs";
import { ShellDialog } from "./shell-dialog";

/** Props of {@link WhatsNewDialog}. */
export interface WhatsNewDialogProps {
  readonly onClose: () => void;
  readonly opener: HTMLElement | null;
}

/** Returns a version's heading: "Latest changes" for not yet numbered changes, else "1.2.0 · date". */
function versionHeading(version: string, date: string | null): string {
  const name = version === "Unreleased" ? t("shell.whatsNew.latest") : version;
  return date === null ? name : `${name} · ${date}`;
}

/** Renders the open What's new dialog. */
export function WhatsNewDialog({ onClose, opener }: WhatsNewDialogProps): React.JSX.Element {
  useEffect(() => {
    writeLastSeenVersion(app.version);
  }, []);

  return (
    <ShellDialog title={t("shell.whatsNew.title")} onClose={onClose} opener={opener}>
      <div className="space-y-4 text-sm">
        {__CHANGELOG__.length === 0 && <p className="text-muted-foreground">{t("shell.whatsNew.empty")}</p>}
        {__CHANGELOG__.map((entry) => (
          <section key={entry.version} className="space-y-2">
            <h3 className="font-semibold">{versionHeading(entry.version, entry.date)}</h3>
            <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
              {entry.items.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </section>
        ))}
        <a className="inline-flex min-h-11 items-center text-primary underline-offset-4 hover:underline" href={`${app.repo}/blob/main/CHANGELOG.md`} target="_blank" rel="noopener noreferrer">
          {t("shell.whatsNew.fullChangelog")}
        </a>
      </div>
    </ShellDialog>
  );
}
