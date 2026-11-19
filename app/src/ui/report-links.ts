// Report a problem without a webhook (app-shell rule 7, feedback-reporting): a pre-filled GitHub issue
// (public, needs an account) or an email (no account; the user's address is never published). Used by
// the Report dialog and the error screen. Technical details stay English (they go to the developer).
import { app } from "../config";

/** Longest body put into a URL; GitHub and mail apps refuse very long addresses. */
const MAX_BODY_CHARS = 6000;

/** Returns how the app is running: installed or in a browser tab. */
function displayMode(): "standalone" | "browser" {
  return window.matchMedia("(display-mode: standalone)").matches ? "standalone" : "browser";
}

/** Returns the technical details attached to a report (no game data, no names). */
export function diagnostics(): string {
  return [
    `App: ${app.name} ${app.version}`,
    `Browser: ${navigator.userAgent}`,
    `Screen: ${String(window.screen.width)}×${String(window.screen.height)}`,
    `Display: ${displayMode()}`,
    `Language: ${navigator.language}`,
    `Time: ${new Date().toISOString()}`,
  ].join("\n");
}

/** A report: a short title and the text the user wrote (plus details, when included). */
export interface ProblemReport {
  readonly title: string;
  readonly body: string;
}

/** Returns the address of a new GitHub issue pre-filled with `report`. */
export function githubIssueUrl({ title, body }: ProblemReport): string {
  const query = new URLSearchParams({ title, body: body.slice(0, MAX_BODY_CHARS) });
  return `${app.repo}/issues/new?${query.toString()}`;
}

/** Returns a mailto: address to the app's contact email pre-filled with `report`. */
export function mailtoUrl({ title, body }: ProblemReport): string {
  // because URLSearchParams writes spaces as "+", which mail apps show literally
  const encode = (text: string): string => encodeURIComponent(text);
  return `mailto:${app.contact.email}?subject=${encode(title)}&body=${encode(body.slice(0, MAX_BODY_CHARS))}`;
}
