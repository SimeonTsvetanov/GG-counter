// The in-app "Something went wrong" screen (app-shell → error-pages §2): plain words on what happened
// and what is safe, Reload (primary), Export my data, Report a problem, Copy details and the technical
// details. Shown by the error boundary instead of a blank page; focus moves to the title.
import { useEffect, useRef, useState } from "react";
import { Button } from "../components/ui/button";
import { app } from "../config";
import { t } from "../i18n";
import { downloadExport } from "./download-export";
import { diagnostics, githubIssueUrl, mailtoUrl } from "./report-links";

/** Returns the technical details of `error` for Copy details and the report. */
export function errorDetails(error: Error): string {
  return [`Error: ${error.name}: ${error.message}`, diagnostics(), "", error.stack ?? "(no stack)"].join("\n");
}

/** Renders the full-screen error view for `error`. */
export function ErrorScreen({ error }: { error: Error }): React.JSX.Element {
  const title = useRef<HTMLHeadingElement>(null);
  const [status, setStatus] = useState("");
  const details = errorDetails(error);
  const report = { title: `[${app.name}] Crash: ${error.message.slice(0, 80)}`, body: details };

  useEffect(() => {
    document.title = t("shell.error.docTitle", { name: app.name });
    title.current?.focus();
  }, []);

  const exportData = (): void => {
    try {
      setStatus(t("shell.settings.exported", { file: downloadExport() }));
    } catch {
      // because the storage or the download itself may be what failed; the message says what to do
      setStatus(t("shell.error.exportFailed"));
    }
  };

  const copy = (): void => {
    void navigator.clipboard.writeText(details).then(() => { setStatus(t("shell.copied")); }, () => { setStatus(""); });
  };

  return (
    <main role="alert" aria-labelledby="error-title" className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 p-6 text-foreground">
      <div aria-hidden className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-2xl font-bold text-destructive">!</div>
      <h1 id="error-title" ref={title} tabIndex={-1} className="text-2xl font-semibold focus-visible:outline-none">{t("shell.error.title")}</h1>
      <p className="text-muted-foreground">{t("shell.error.text", { name: app.name })}</p>
      <p className="w-fit rounded-full bg-muted px-3 py-1 text-xs font-medium">{error.name === "Error" ? t("shell.error.unexpected") : error.name}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <Button onClick={() => { location.reload(); }}>{t("shell.error.reload")}</Button>
        <Button variant="secondary" onClick={exportData}>{t("shell.error.export")}</Button>
        <Button asChild variant="secondary">
          <a href={githubIssueUrl(report)} target="_blank" rel="noopener noreferrer">{t("shell.error.report")}</a>
        </Button>
        <Button variant="secondary" onClick={copy}>{t("shell.copy")}</Button>
      </div>
      <p className="text-sm">
        <a className="text-primary underline-offset-4 hover:underline" href={mailtoUrl(report)}>{t("shell.report.email")}</a>
      </p>
      <p role="status" className="min-h-5 text-sm text-muted-foreground">{status}</p>
      <details className="rounded-lg bg-muted/50 p-3 text-xs">
        <summary className="cursor-pointer font-medium">{t("shell.error.details")}</summary>
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words font-mono">{details}</pre>
      </details>
    </main>
  );
}
