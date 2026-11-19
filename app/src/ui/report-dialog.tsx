// Report a problem (app-shell §6, rule 7): the user describes the problem, chooses whether technical
// details are added, and sends it as a GitHub issue or an email. Nothing is sent by the app itself.
import { useId, useState } from "react";
import { Button } from "../components/ui/button";
import { app } from "../config";
import { t } from "../i18n";
import { diagnostics, githubIssueUrl, mailtoUrl, type ProblemReport } from "./report-links";
import { ShellDialog } from "./shell-dialog";

/** Props of {@link ReportDialog}. */
export interface ReportDialogProps {
  readonly onClose: () => void;
  readonly opener: HTMLElement | null;
}

/** Longest description accepted (the template's limit). */
const MAX_TEXT_LENGTH = 4000;

/** Returns the report for `text`, with the technical details when `withDetails`. */
function buildReport(text: string, withDetails: boolean): ProblemReport {
  const firstLine = text.trim().split("\n")[0] ?? "";
  const body = withDetails ? `${text.trim()}\n\n---\n${diagnostics()}` : text.trim();
  return { title: `[${app.name}] ${firstLine.slice(0, 80)}`, body };
}

/** Renders the open Report a problem dialog. */
export function ReportDialog({ onClose, opener }: ReportDialogProps): React.JSX.Element {
  const [text, setText] = useState("");
  const [withDetails, setWithDetails] = useState(true);
  const [isMissing, setIsMissing] = useState(false);
  const ids = { text: useId(), error: useId(), hint: useId() };
  const report = buildReport(text, withDetails);
  const isEmpty = text.trim().length === 0;
  const guard = (event: React.MouseEvent): void => {
    if (!isEmpty) return;
    event.preventDefault();
    setIsMissing(true);
    document.getElementById(ids.text)?.focus();
  };

  return (
    <ShellDialog title={t("shell.report.title")} description={t("shell.report.intro")} onClose={onClose} opener={opener}>
      <div className="space-y-3 text-sm">
        <label htmlFor={ids.text} className="block font-medium">{t("shell.report.label")}</label>
        <textarea
          id={ids.text}
          value={text}
          maxLength={MAX_TEXT_LENGTH}
          rows={5}
          placeholder={t("shell.report.placeholder")}
          aria-invalid={isMissing && isEmpty}
          aria-describedby={`${ids.error} ${ids.hint}`}
          onChange={(event) => { setText(event.target.value); setIsMissing(false); }}
          className="w-full rounded-md bg-muted px-3 py-2 text-base focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        />
        <p id={ids.error} role="alert" className="text-destructive">{isMissing && isEmpty ? t("shell.report.empty") : ""}</p>
        <label className="flex min-h-11 items-center gap-3">
          <input type="checkbox" checked={withDetails} onChange={(event) => { setWithDetails(event.target.checked); }} className="h-5 w-5 accent-primary" />
          {t("shell.report.details")}
        </label>
        <p id={ids.hint} className="text-xs text-muted-foreground">{t("shell.report.public")}</p>
        <div className="grid gap-2 sm:grid-cols-2">
          <Button asChild>
            <a href={mailtoUrl(report)} onClick={guard}>{t("shell.report.email")}</a>
          </Button>
          <Button asChild variant="secondary">
            <a href={githubIssueUrl(report)} target="_blank" rel="noopener noreferrer" onClick={guard}>{t("shell.report.github")}</a>
          </Button>
        </div>
      </div>
    </ShellDialog>
  );
}
