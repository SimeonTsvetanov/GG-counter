// Where a link in a policy dialog goes (PLAN T-10): links to another policy page or to `#help` /
// `#report` open that dialog in place, our own files open in this tab, other sites in a new tab. The
// sources write our links as `{base}…` (scripts/legal.ts), so they work on the standalone pages too.
import { isPolicyPage, type PolicyPageId } from "./legal-document";
import { dialogFromHash, type ShellDialogId } from "./use-shell-dialog";

/** What a link of a policy page does inside the app. */
export type LegalLinkTarget =
  | { readonly kind: "dialog"; readonly dialog: ShellDialogId }
  | { readonly kind: "same-tab"; readonly href: string }
  | { readonly kind: "new-tab"; readonly href: string };

/** Returns the address of a standalone policy page, relative to the app's page (`./privacy/`). */
export function policyPageHref(page: PolicyPageId): string {
  return `./${page}/`;
}

/**
 * Returns what the link `href` of a policy page does in the app.
 *
 * @param basePath - the base path the sources were filled with (`app.basePath`, e.g. "/GG-counter/").
 */
export function legalLinkTarget(href: string, basePath: string): LegalLinkTarget {
  if (href.startsWith("mailto:")) return { kind: "same-tab", href };
  if (!href.startsWith(basePath)) return { kind: "new-tab", href };
  const rest = href.slice(basePath.length);
  const linked = rest.startsWith("#") ? dialogFromHash(rest) : null;
  if (linked !== null) return { kind: "dialog", dialog: linked.id };
  const page = rest.replace(/\/$/, "");
  if (rest.endsWith("/") && isPolicyPage(page)) return { kind: "dialog", dialog: page };
  // because the app may run under another base (dev serves "/"): our own files are relative to its page
  return { kind: "same-tab", href: `./${rest}` };
}

/** True for a plain click: modifier keys or another button keep the browser's own link behaviour. */
export function isPlainClick(event: Pick<MouseEvent, "button" | "metaKey" | "ctrlKey" | "shiftKey" | "altKey">): boolean {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
}
