// Unit tests for app/src/ui/pwa.ts (pwa → pwa §5): update helpers and the initPwa wiring — periodic and
// foreground checks, multi-tab controller change, reload-once after a stale chunk. Browser globals are
// small stubs; the plugin's registerSW is mocked. Ported from the forge template's pwa.test.ts.
import { afterEach, describe, expect, it, vi, type Mock } from "vitest";
import type { RegisterSWOptions } from "vite-plugin-pwa/types";

const updateSW = vi.fn<(reload?: boolean) => Promise<void>>(() => Promise.resolve());
const registerSW = vi.hoisted(() => vi.fn());
vi.mock("virtual:pwa-register", () => ({ registerSW }));

const pwa = await import("../../src/ui/pwa.ts");
const { checkForUpdate, controllerChangeAction, shouldReloadAfterPreloadError, initPwa } = pwa;

function registration(installing: boolean): { installing: ServiceWorker | null; update: Mock<() => Promise<void>> } {
  // because only "is something installing" matters here, not a real ServiceWorker
  return { installing: installing ? ({} as unknown as ServiceWorker) : null, update: vi.fn(() => Promise.resolve()) };
}

function memoryStorage(): Pick<Storage, "getItem" | "setItem"> {
  const items = new Map<string, string>();
  return { getItem: (key) => items.get(key) ?? null, setItem: (key, value) => { items.set(key, value); } };
}

/** Stubs window, document, navigator, location and sessionStorage, then runs initPwa(). */
function start({ controlled = true, storage = memoryStorage() }: { controlled?: boolean; storage?: Pick<Storage, "getItem" | "setItem"> } = {}) {
  registerSW.mockImplementation(() => updateSW);
  const win = new EventTarget();
  const doc = Object.assign(new EventTarget(), { visibilityState: "visible" });
  const serviceWorker = Object.assign(new EventTarget(), { controller: controlled ? {} : null });
  const reload = vi.fn();
  const onUpdateReady = vi.fn<(apply: () => void) => void>();
  const onOfflineReady = vi.fn();
  vi.stubGlobal("window", win);
  vi.stubGlobal("document", doc);
  vi.stubGlobal("navigator", { serviceWorker, onLine: true });
  vi.stubGlobal("location", { reload });
  vi.stubGlobal("sessionStorage", storage);
  initPwa({ onUpdateReady, onOfflineReady });
  const options = registerSW.mock.calls.at(-1)?.[0] as RegisterSWOptions | undefined;
  if (!options) throw new Error("initPwa() did not call registerSW()");
  /** Runs the Reload action of the last update offer. */
  const tapReload = (): void => { onUpdateReady.mock.calls.at(-1)?.[0](); };
  return { win, doc, serviceWorker, reload, options, onUpdateReady, onOfflineReady, tapReload };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe("checkForUpdate", () => {
  it("fetches the script uncached and calls update() on 200", async () => {
    const reg = registration(false);
    const fetchScript = vi.fn(() => Promise.resolve({ status: 200 }));
    await expect(checkForUpdate({ swUrl: "/GG-counter/sw.js", registration: reg, isOnline: () => true, fetchScript })).resolves.toBe(true);
    expect(fetchScript).toHaveBeenCalledWith("/GG-counter/sw.js", expect.objectContaining({ cache: "no-store" }));
    expect(reg.update).toHaveBeenCalledOnce();
  });
  it("skips while a new worker is installing, and offline", async () => {
    const fetchScript = vi.fn(() => Promise.resolve({ status: 200 }));
    await expect(checkForUpdate({ swUrl: "sw.js", registration: registration(true), isOnline: () => true, fetchScript })).resolves.toBe(false);
    await expect(checkForUpdate({ swUrl: "sw.js", registration: registration(false), isOnline: () => false, fetchScript })).resolves.toBe(false);
    expect(fetchScript).not.toHaveBeenCalled();
  });
  it("does not update when the script answers 404 or the fetch fails", async () => {
    const reg = registration(false);
    await expect(checkForUpdate({ swUrl: "sw.js", registration: reg, isOnline: () => true, fetchScript: () => Promise.resolve({ status: 404 }) })).resolves.toBe(false);
    await expect(checkForUpdate({ swUrl: "sw.js", registration: reg, isOnline: () => true, fetchScript: () => Promise.reject(new TypeError("offline")) })).resolves.toBe(false);
    expect(reg.update).not.toHaveBeenCalled();
  });
});

describe("controllerChangeAction", () => {
  it("reloads only the tab that asked; offers a reload for another tab's update; ignores the first install", () => {
    expect(controllerChangeAction({ hadController: true, updateRequested: true })).toBe("reload");
    expect(controllerChangeAction({ hadController: true, updateRequested: false })).toBe("offer-reload");
    expect(controllerChangeAction({ hadController: false, updateRequested: false })).toBe("ignore");
  });
});

describe("shouldReloadAfterPreloadError", () => {
  it("reloads the first time, not right after a reload, and again for a later deploy", () => {
    expect(shouldReloadAfterPreloadError(null, 1_000)).toBe(true);
    expect(shouldReloadAfterPreloadError(1_000, 1_000 + pwa.PRELOAD_RELOAD_WINDOW_MS)).toBe(false);
    expect(shouldReloadAfterPreloadError(1_000, 1_001 + pwa.PRELOAD_RELOAD_WINDOW_MS)).toBe(true);
  });
});

describe("initPwa: updates never reload by themselves", () => {
  it("replaces the plugin's reload-every-tab default with a no-op", () => {
    const { options, reload } = start();
    expect(options.onNeedReload).toBeTypeOf("function");
    options.onNeedReload?.();
    expect(reload).not.toHaveBeenCalled();
  });
  it("a waiting worker is offered; Reload applies it and reloads on controllerchange", () => {
    const { options, serviceWorker, reload, onUpdateReady, tapReload } = start();
    options.onNeedRefresh?.();
    expect(onUpdateReady).toHaveBeenCalledOnce();
    expect(reload).not.toHaveBeenCalled();
    tapReload();
    expect(updateSW).toHaveBeenCalledWith(true);
    serviceWorker.dispatchEvent(new Event("controllerchange"));
    expect(reload).toHaveBeenCalledOnce();
  });
  it("another tab's update only offers a reload here", () => {
    const { serviceWorker, reload, onUpdateReady, tapReload } = start();
    serviceWorker.dispatchEvent(new Event("controllerchange"));
    expect(reload).not.toHaveBeenCalled();
    expect(onUpdateReady).toHaveBeenCalledOnce();
    tapReload();
    expect(reload).toHaveBeenCalledOnce();
  });
  it("the first service worker taking control does nothing; offline-ready is passed on", () => {
    const { serviceWorker, reload, onUpdateReady, options, onOfflineReady } = start({ controlled: false });
    serviceWorker.dispatchEvent(new Event("controllerchange"));
    expect(reload).not.toHaveBeenCalled();
    expect(onUpdateReady).not.toHaveBeenCalled();
    options.onOfflineReady?.();
    expect(onOfflineReady).toHaveBeenCalledOnce();
  });
  it("a tab without a controller (hard reload) reloads directly after Reload", async () => {
    const { options, reload, tapReload } = start({ controlled: false });
    options.onNeedRefresh?.();
    tapReload();
    await vi.waitFor(() => { expect(reload).toHaveBeenCalledOnce(); });
    expect(updateSW).toHaveBeenCalledWith(true);
  });
  it("a registration error is only logged", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { options } = start();
    options.onRegisterError?.(new Error("blocked"));
    expect(warn).toHaveBeenCalledOnce();
  });
  it("without service worker support nothing is registered", () => {
    vi.stubGlobal("window", new EventTarget());
    vi.stubGlobal("navigator", {});
    initPwa({ onUpdateReady: vi.fn(), onOfflineReady: vi.fn() });
    expect(registerSW).not.toHaveBeenCalled();
  });
});

describe("initPwa: update checks", () => {
  it("checks on return to the foreground at most every 5 minutes, and every hour", () => {
    vi.useFakeTimers();
    const fetchScript = vi.fn(() => Promise.resolve({ status: 200 }));
    const { options, doc } = start();
    vi.stubGlobal("fetch", fetchScript);
    options.onRegisteredSW?.("sw.js", registration(false) as unknown as ServiceWorkerRegistration);
    doc.dispatchEvent(new Event("visibilitychange"));
    expect(fetchScript).not.toHaveBeenCalled();
    vi.advanceTimersByTime(pwa.UPDATE_CHECK_MIN_GAP_MS);
    doc.dispatchEvent(new Event("visibilitychange"));
    expect(fetchScript).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(pwa.UPDATE_CHECK_INTERVAL_MS);
    expect(fetchScript).toHaveBeenCalledTimes(2);
  });
  it("no registration → no checks", () => {
    const interval = vi.spyOn(globalThis, "setInterval");
    const { options } = start();
    options.onRegisteredSW?.("sw.js", undefined);
    expect(interval).not.toHaveBeenCalled();
  });
});

describe("initPwa: stale chunk after a deploy (vite:preloadError)", () => {
  const preloadError = (): Event => new Event("vite:preloadError", { cancelable: true });

  it("reloads once, then lets a repeat reach the error screen", () => {
    const { win, reload } = start();
    const first = preloadError();
    win.dispatchEvent(first);
    expect(first.defaultPrevented).toBe(true);
    const second = preloadError();
    win.dispatchEvent(second);
    expect(second.defaultPrevented).toBe(false);
    expect(reload).toHaveBeenCalledOnce();
  });
  it("never reloads when sessionStorage throws (no guard, no loop)", () => {
    const blocked = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
    const { win, reload } = start({ storage: blocked });
    const event = preloadError();
    win.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});
