// Report a problem (app-shell §6, rule 7): the user describes the problem, chooses whether technical
// details are added, and sends it as a GitHub issue or an email. Nothing is sent by the app itself.
import { useId, useState } from "react";
import { Button } from "gg-counter-miniapp/components/ui/button";
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
      <div className="flex flex-col gap-3">
        <label htmlFor={ids.text} className="font-semibold">{t("shell.report.label")}</label>
        <textarea
          id={ids.text}
          value={text}
          maxLength={MAX_TEXT_LENGTH}
          rows={5}
          placeholder={t("shell.report.placeholder")}
          aria-invalid={isMissing && isEmpty}
          aria-describedby={`${ids.error} ${ids.hint}`}
          onChange={(event) => { setText(event.target.value); setIsMissing(false); }}
          className="field"
        />
        <p id={ids.error} role="alert" className="field-error">{isMissing && isEmpty ? t("shell.report.empty") : ""}</p>
        <label className="flex min-h-tap items-center gap-3">
          <input type="checkbox" checked={withDetails} onChange={(event) => { setWithDetails(event.target.checked); }} className="size-5" />
          {t("shell.report.details")}
        </label>
        <p id={ids.hint} className="field-hint">{t("shell.report.public")}</p>
        <div className="button-stack">
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
