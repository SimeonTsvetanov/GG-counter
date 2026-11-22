// Unit tests of the standalone host (app/src/host.ts, Quizzard PLAN GG-01): what the game screen gets
// from the standalone page — toasts, sharing (app/src/ui/web-share.ts), the language and theme signals,
// the header slot, the overlay container and the root. Browser globals are small stubs.
import { afterEach, describe, expect, it, vi } from "vitest";
import { HEADER_SLOT_CLASS, createStandaloneHost, type Host } from "../src/host.ts";
import { applyLanguage } from "../src/i18n/index.ts";
import type { Toast } from "../src/ui/toast.tsx";

/** A fake page: `<html>` with a class list, `<body>` and `createElement`. */
function fakePage(themeClass: "light" | "dark") {
  const classes = new Set<string>([themeClass]);
  const documentElement = { classList: { contains: (name: string) => classes.has(name) }, style: {} };
  const body = { tagName: "BODY" };
  const page = { documentElement, body, createElement: (tagName: string) => ({ tagName, className: "" }) };
  return { page, classes };
}

/** A standalone host over a fake page; `shown` collects its toasts. */
function standalone(themeClass: "light" | "dark" = "light") {
  const { page, classes } = fakePage(themeClass);
  const shown: Toast[] = [];
  // because the host only uses the parts fakePage() has
  const host = createStandaloneHost({ toast: (toast) => { shown.push(toast); }, document: page as unknown as Document });
  return { host, page, classes, shown };
}

/** Stubs `navigator` with the given share and clipboard functions (either may be missing). */
function stubNavigator(nav: { share?: (data: ShareData) => Promise<void>; writeText?: (text: string) => Promise<void> }) {
  vi.stubGlobal("navigator", { share: nav.share, clipboard: nav.writeText ? { writeText: nav.writeText } : undefined });
}

describe("createStandaloneHost: page elements", () => {
  it("portals into <body>, uses <html> as root and gives a header slot element", () => {
    const { host, page } = standalone();
    expect(host.portalContainer).toBe(page.body);
    expect(host.root).toBe(page.documentElement);
    expect(host.headerActions).toMatchObject({ tagName: "div", className: HEADER_SLOT_CLASS });
  });

  it("keeps title, busy state and storage to the page (no-ops)", () => {
    const { host, shown } = standalone();
    expect(() => { host.setTitle("Scores"); host.setTitle(null); host.setBusy(true); host.notifySaved(); }).not.toThrow();
    expect(shown).toEqual([]);
  });
});

describe("createStandaloneHost: toast", () => {
  it("shows the message as an info toast; the tone is dropped", () => {
    const { host, shown } = standalone();
    host.toast("Copied", { tone: "error" });
    expect(shown).toEqual([{ message: "Copied" }]);
  });

  it("keeps the action's label and runs its function", () => {
    const { host, shown } = standalone();
    const run = vi.fn();
    host.toast("Removed", { action: { label: "Undo", run } });
    expect(shown[0]?.message).toBe("Removed");
    expect(shown[0]?.action?.label).toBe("Undo");
    shown[0]?.action?.run();
    expect(run).toHaveBeenCalledOnce();
  });
});

describe("createStandaloneHost: share", () => {
  const data = { title: "GG Counter", text: "Leaderboard" };

  it("hands only the given fields to the share sheet", async () => {
    const share = vi.fn<(shared: ShareData) => Promise<void>>(() => Promise.resolve());
    stubNavigator({ share });
    await expect(standalone().host.share(data)).resolves.toBe("shared");
    expect(share).toHaveBeenCalledWith({ title: "GG Counter", text: "Leaderboard" });
    expect(Object.keys(share.mock.calls[0]?.[0] ?? {})).toEqual(["title", "text"]);
  });

  it("is cancelled (and copies nothing) when the user closes the share sheet", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    stubNavigator({ share: () => Promise.reject(new DOMException("closed", "AbortError")), writeText });
    await expect(standalone().host.share(data)).resolves.toBe("cancelled");
    expect(writeText).not.toHaveBeenCalled();
  });

  it("copies the text when Web Share refuses or is missing", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    stubNavigator({ share: () => Promise.reject(new DOMException("no tap", "NotAllowedError")), writeText });
    await expect(standalone().host.share(data)).resolves.toBe("copied");
    stubNavigator({ writeText });
    await expect(standalone().host.share({ text: "Hi", url: "https://example.org/" })).resolves.toBe("copied");
    expect(writeText.mock.calls).toEqual([["Leaderboard"], ["Hi\nhttps://example.org/"]]);
  });

  it("fails without Web Share and clipboard, or when the clipboard is blocked", async () => {
    stubNavigator({});
    await expect(standalone().host.share(data)).resolves.toBe("failed");
    stubNavigator({ writeText: () => Promise.reject(new Error("blocked")) });
    await expect(standalone().host.share(data)).resolves.toBe("failed");
  });
});

describe("createStandaloneHost: signals", () => {
  afterEach(async () => { await applyLanguage("en"); });

  it("reports the active language and each change until unsubscribed", async () => {
    const { host } = standalone();
    expect(host.language.get()).toBe("en");
    const seen: string[] = [];
    const stop = host.language.subscribe((lang) => { seen.push(lang); });
    await applyLanguage("bg");
    expect(host.language.get()).toBe("bg");
    stop();
    await applyLanguage("en");
    expect(seen).toEqual(["bg"]);
  });

  it("reads the resolved theme from <html> and reports real changes only", () => {
    let notify = (): void => undefined;
    const disconnect = vi.fn();
    vi.stubGlobal("MutationObserver", class {
      constructor(callback: () => void) { notify = callback; }
      observe(): void { /* the test calls notify() itself */ }
      disconnect = disconnect;
    });
    const { host, classes }: { host: Host; classes: Set<string> } = standalone("dark");
    expect(host.theme.get()).toBe("dark");
    const seen: string[] = [];
    const stop = host.theme.subscribe((theme) => { seen.push(theme); });
    notify();
    classes.delete("dark");
    classes.add("light");
    notify();
    notify();
    expect(seen).toEqual(["light"]);
    stop();
    expect(disconnect).toHaveBeenCalledOnce();
  });
});
