// Unit tests of the standalone context (app/src/miniapp/context.ts, PLAN GG-02): what the game screen gets
// from the standalone page through the contract — toasts, sharing (app/src/ui/web-share.ts), the language
// and theme signals, the header slot and the storage area. Carried over from the GG-01 host tests
// (app/test/host.test.ts), whose `createStandaloneHost` this context replaced. Browser globals are stubs.
import { afterEach, describe, expect, it, vi } from "vitest";
import { STORAGE_AREA, meta } from "gg-counter-miniapp/meta";
import { FakeStorage, useStorage } from "gg-counter-miniapp/test/fake-storage";
import { HEADER_SLOT_CLASS, createStandaloneContext } from "../../src/miniapp/context.ts";
import { applyLanguage } from "../../src/i18n/index.ts";
import type { Toast } from "../../src/ui/toast.tsx";

/** A fake page: `<html>` with a class list and `createElement`. */
function fakePage(themeClass: "light" | "dark") {
  const classes = new Set<string>([themeClass]);
  const documentElement = { classList: { contains: (name: string) => classes.has(name) } };
  const page = { documentElement, createElement: (tagName: string) => ({ tagName, className: "" }) };
  return { page, classes };
}

/** A standalone context over a fake page; `shown` collects its toasts. */
function standalone(themeClass: "light" | "dark" = "light") {
  const { page, classes } = fakePage(themeClass);
  const shown: Toast[] = [];
  // because the context only uses the parts fakePage() has
  const context = createStandaloneContext({ toast: (toast) => { shown.push(toast); }, document: page as unknown as Document });
  return { context, page, classes, shown };
}

/** Stubs `navigator` with the given share and clipboard functions (either may be missing). */
function stubNavigator(nav: { share?: (data: ShareData) => Promise<void>; writeText?: (text: string) => Promise<void> }) {
  vi.stubGlobal("navigator", { share: nav.share, clipboard: nav.writeText ? { writeText: nav.writeText } : undefined });
}

describe("createStandaloneContext: page parts", () => {
  it("is the standalone host with a header slot element, no launch parameters and the package's storage area", () => {
    const { context } = standalone();
    expect(context.host).toBe("standalone");
    expect(context.slots.headerActions).toMatchObject({ tagName: "div", className: HEADER_SLOT_CLASS });
    expect([...context.query]).toEqual([]);
    expect(context.storage.area).toBe(STORAGE_AREA);
    expect(meta.storage).toBe(STORAGE_AREA);
  });

  it("keeps title, busy state, navigation and storage to the page (no-ops)", () => {
    const { context, shown } = standalone();
    expect(() => {
      context.shell.setTitle("Scores");
      context.shell.setTitle(null);
      context.shell.setBusy(true);
      context.navigation.home();
      context.navigation.open("teams");
      context.storage.notifySaved();
    }).not.toThrow();
    expect(shown).toEqual([]);
  });

  it("has no confirm service: the screen asks with its own alerts", async () => {
    await expect(standalone().context.shell.confirm({ title: "Clear?", confirm: "Clear" })).rejects.toThrow(/^CONFIRM_UNSUPPORTED/);
  });

  it("keeps prefs under the app's own keys (gg-counter:v1:<key>, JSON)", () => {
    const storage = new FakeStorage();
    useStorage(storage);
    const { prefs } = standalone().context.storage;
    expect(prefs.set("probe", { n: 1 })).toBe(true);
    expect(storage.getItem("gg-counter:v1:probe")).toBe('{"n":1}');
    expect(prefs.get("probe", null)).toEqual({ n: 1 });
    prefs.remove("probe");
    expect(storage.getItem("gg-counter:v1:probe")).toBeNull();
    expect(prefs.get("probe", "fallback")).toBe("fallback");
  });
});

describe("createStandaloneContext: toast", () => {
  it("shows the message as an info toast; the tone is dropped", () => {
    const { context, shown } = standalone();
    context.shell.toast("Copied", { tone: "error" });
    expect(shown).toEqual([{ message: "Copied" }]);
  });

  it("keeps the action's label and runs its function", () => {
    const { context, shown } = standalone();
    const run = vi.fn();
    context.shell.toast("Removed", { action: { label: "Undo", run } });
    expect(shown[0]?.message).toBe("Removed");
    expect(shown[0]?.action?.label).toBe("Undo");
    shown[0]?.action?.run();
    expect(run).toHaveBeenCalledOnce();
  });
});

describe("createStandaloneContext: share", () => {
  const data = { title: "GG Counter", text: "Leaderboard" };

  it("hands only the given fields to the share sheet", async () => {
    const share = vi.fn<(shared: ShareData) => Promise<void>>(() => Promise.resolve());
    stubNavigator({ share });
    await expect(standalone().context.shell.share(data)).resolves.toBe("shared");
    expect(share).toHaveBeenCalledWith({ title: "GG Counter", text: "Leaderboard" });
    expect(Object.keys(share.mock.calls[0]?.[0] ?? {})).toEqual(["title", "text"]);
  });

  it("is cancelled (and copies nothing) when the user closes the share sheet", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    stubNavigator({ share: () => Promise.reject(new DOMException("closed", "AbortError")), writeText });
    await expect(standalone().context.shell.share(data)).resolves.toBe("cancelled");
    expect(writeText).not.toHaveBeenCalled();
  });

  it("copies the text when Web Share refuses or is missing", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    stubNavigator({ share: () => Promise.reject(new DOMException("no tap", "NotAllowedError")), writeText });
    await expect(standalone().context.shell.share(data)).resolves.toBe("copied");
    stubNavigator({ writeText });
    await expect(standalone().context.shell.share({ text: "Hi", url: "https://example.org/" })).resolves.toBe("copied");
    expect(writeText.mock.calls).toEqual([["Leaderboard"], ["Hi\nhttps://example.org/"]]);
  });

  it("fails without Web Share and clipboard, or when the clipboard is blocked", async () => {
    stubNavigator({});
    await expect(standalone().context.shell.share(data)).resolves.toBe("failed");
    stubNavigator({ writeText: () => Promise.reject(new Error("blocked")) });
    await expect(standalone().context.shell.share(data)).resolves.toBe("failed");
  });
});

describe("createStandaloneContext: signals", () => {
  afterEach(async () => { await applyLanguage("en"); });

  it("reports the page's language and each change until unsubscribed", async () => {
    const { context } = standalone();
    expect(context.language.get()).toBe("en");
    const seen: string[] = [];
    const stop = context.language.subscribe((lang) => { seen.push(lang); });
    await applyLanguage("bg");
    expect(context.language.get()).toBe("bg");
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
    const { context, classes } = standalone("dark");
    expect(context.theme.get()).toBe("dark");
    const seen: string[] = [];
    const stop = context.theme.subscribe((theme) => { seen.push(theme); });
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
