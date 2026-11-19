// Unit tests of the policy links inside the app (app/src/ui/legal-links.ts) and the shell's policy entries.
import { describe, expect, it } from "vitest";
import { app, type ShellItemId } from "../../src/config.ts";
import { POLICY_PAGES, isPolicyPage } from "../../src/ui/legal-document.ts";
import { isPlainClick, legalLinkTarget, policyPageHref } from "../../src/ui/legal-links.ts";
import { SHELL_ITEMS } from "../../src/ui/shell-items.ts";
import { SHELL_DIALOGS } from "../../src/ui/use-shell-dialog.ts";

const base = "/GG-counter/";

describe("legalLinkTarget", () => {
  it("opens another policy page or #help / #report as a dialog in place", () => {
    expect(legalLinkTarget(`${base}privacy/`, base)).toEqual({ kind: "dialog", dialog: "privacy" });
    expect(legalLinkTarget(`${base}ai-notice/`, base)).toEqual({ kind: "dialog", dialog: "ai-notice" });
    expect(legalLinkTarget(`${base}#help`, base)).toEqual({ kind: "dialog", dialog: "help" });
    expect(legalLinkTarget(`${base}#report`, base)).toEqual({ kind: "dialog", dialog: "report" });
  });

  it("opens our own files relative to the app, email in this tab and other sites in a new tab", () => {
    expect(legalLinkTarget(`${base}third-party-licenses.txt`, base)).toEqual({ kind: "same-tab", href: "./third-party-licenses.txt" });
    expect(legalLinkTarget(`${base}cookies/`, base)).toEqual({ kind: "same-tab", href: "./cookies/" });
    expect(legalLinkTarget(`${base}#nothing`, base)).toEqual({ kind: "same-tab", href: "./#nothing" });
    expect(legalLinkTarget("mailto:someone@example.com", base)).toEqual({ kind: "same-tab", href: "mailto:someone@example.com" });
    expect(legalLinkTarget(`${app.repo}/issues`, base)).toEqual({ kind: "new-tab", href: `${app.repo}/issues` });
  });
});

describe("policy entries of the shell", () => {
  it("every policy page is a deep-linkable dialog with a relative standalone address", () => {
    for (const page of POLICY_PAGES) {
      expect(SHELL_DIALOGS).toContain(page);
      expect(policyPageHref(page)).toBe(`./${page}/`);
    }
    expect(isPolicyPage("help")).toBe(false);
  });

  it("menu and footer reach every policy page; Contact opens the Support page", () => {
    expect(SHELL_ITEMS.contact).toEqual({ kind: "dialog", dialog: "support" });
    const opened = (ids: readonly ShellItemId[]): string[] =>
      ids.flatMap((id) => {
        const target = SHELL_ITEMS[id];
        return target.kind === "dialog" && isPolicyPage(target.dialog) ? [target.dialog] : [];
      });
    expect(opened(app.shell.menu.flatMap((group) => group.items)).sort()).toEqual([...POLICY_PAGES].sort());
    expect(opened(app.shell.footer).sort()).toEqual([...POLICY_PAGES].sort());
  });
});

describe("isPlainClick", () => {
  it("is true only for an unmodified primary click", () => {
    const click = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false };
    expect(isPlainClick(click)).toBe(true);
    expect(isPlainClick({ ...click, button: 1 })).toBe(false);
    for (const key of ["metaKey", "ctrlKey", "shiftKey", "altKey"] as const) expect(isPlainClick({ ...click, [key]: true })).toBe(false);
  });
});
