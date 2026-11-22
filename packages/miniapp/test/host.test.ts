// Unit tests of the host seam (src/host.ts): the screen's `Host` is a thin wrapper over the contract's
// `MiniAppContext` plus the placement mount.tsx chose. The standalone services themselves are tested with
// their page (app/test/miniapp/context.test.ts); the placement per host in mount.test.ts.
import { describe, expect, it, vi } from "vitest";
import type { MiniAppContext } from "../src/contract.ts";
import { createHost, type Signal } from "../src/host.ts";

/** A context whose services are spies and whose elements are plain markers. */
function fakeContext() {
  // because createHost never touches the elements, only passes them on
  const element = (name: string) => ({ name }) as unknown as HTMLElement;
  const themeListeners: ((theme: "light" | "dark") => void)[] = [];
  const spies = { toast: vi.fn(), share: vi.fn(() => Promise.resolve("copied" as const)), setTitle: vi.fn(), setBusy: vi.fn(), notifySaved: vi.fn() };
  const context: MiniAppContext = {
    host: "quizzard",
    language: { get: () => "en", subscribe: () => () => undefined },
    theme: { get: () => "dark", subscribe: (listener) => { themeListeners.push(listener); return () => undefined; } },
    query: new URLSearchParams(),
    shell: { toast: spies.toast, confirm: () => Promise.resolve(true), share: spies.share, setTitle: spies.setTitle, setBusy: spies.setBusy },
    navigation: { home: vi.fn(), open: vi.fn() },
    slots: { headerActions: element("header") },
    storage: { area: { prefix: "gg-counter:v1:" }, prefs: { get: (_key, fallback) => fallback, set: () => true, remove: () => undefined }, notifySaved: spies.notifySaved },
  };
  return { context, element, themeListeners, spies };
}

const language: Signal<"en" | "bg"> = { get: () => "bg", subscribe: () => () => undefined };

describe("createHost", () => {
  it("takes the header slot from the context and the overlay container, root and language from the placement", () => {
    const { context, element } = fakeContext();
    const overlays = element("overlays");
    const root = element("root");
    const host = createHost(context, { language, portalContainer: overlays, root });
    expect(host.headerActions).toBe(context.slots.headerActions);
    expect(host.portalContainer).toBe(overlays);
    expect(host.root).toBe(root);
    expect(host.language).toBe(language);
  });

  it("passes toast, share, title, busy and saved through to the shell's services", async () => {
    const { context, element, spies } = fakeContext();
    const host = createHost(context, { language, portalContainer: element("o"), root: element("r") });
    const run = vi.fn();
    host.toast("Removed", { tone: "error", action: { label: "Undo", run } });
    expect(spies.toast).toHaveBeenCalledWith("Removed", { tone: "error", action: { label: "Undo", run } });
    await expect(host.share({ title: "GG Counter", text: "Leaderboard" })).resolves.toBe("copied");
    expect(spies.share).toHaveBeenCalledWith({ title: "GG Counter", text: "Leaderboard" });
    host.setTitle(null);
    host.setBusy(true);
    host.notifySaved();
    expect(spies.setTitle).toHaveBeenCalledWith(null);
    expect(spies.setBusy).toHaveBeenCalledWith(true);
    expect(spies.notifySaved).toHaveBeenCalledOnce();
  });

  it("reads and follows the shell's resolved theme", () => {
    const { context, element, themeListeners } = fakeContext();
    const host = createHost(context, { language, portalContainer: element("o"), root: element("r") });
    expect(host.theme.get()).toBe("dark");
    const seen: string[] = [];
    host.theme.subscribe((theme) => { seen.push(theme); });
    for (const listener of themeListeners) listener("light");
    expect(seen).toEqual(["light"]);
  });
});
