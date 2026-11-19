// Service worker registration and update handling (pwa → pwa §5), ported from the forge template's
// src/pwa.ts. It never reloads for an update by itself — only after the user taps Reload in the update
// toast — so nobody loses a dialog or typed text mid-game. One exception: a stale chunk after a deploy
// (`vite:preloadError`) reloads once. The React side (use-pwa-updates.ts) shows the toasts.
import { registerSW } from "virtual:pwa-register";
import { readPreloadReloadAt, writePreloadReloadAt } from "../storage/session";

/** How often an open app asks the server for a new service worker (pwa §5: every 60 min). */
export const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;
/** A return to the foreground checks again only if the last check is at least this old (5 min). */
export const UPDATE_CHECK_MIN_GAP_MS = 5 * 60 * 1000;
/** A second chunk-load failure within this window means the reload did not help: stop reloading. */
export const PRELOAD_RELOAD_WINDOW_MS = 60 * 1000;

/** The part of a ServiceWorkerRegistration the update check needs. */
export interface UpdatableRegistration {
  readonly installing: ServiceWorker | null;
  update(): Promise<unknown>;
}

/** Inputs of {@link checkForUpdate}; the browser globals are passed in so the check is testable. */
export interface UpdateCheckOptions {
  readonly swUrl: string;
  readonly registration: UpdatableRegistration;
  readonly isOnline: () => boolean;
  readonly fetchScript: (url: string, init: RequestInit) => Promise<Pick<Response, "status">>;
}

/** What the app shows for the service worker's events. */
export interface PwaEvents {
  /** A new version is ready: offer it with a Reload button that calls `reload`. */
  readonly onUpdateReady: (reload: () => void) => void;
  /** The app is cached and works offline from now on (first install only). */
  readonly onOfflineReady: () => void;
}

/**
 * Asks the browser to look for a new service worker, unless one is already installing or the
 * device is offline. The script is fetched first, bypassing the HTTP cache, so `update()` only
 * runs when the server answers 200.
 *
 * @returns true when `registration.update()` was called and resolved.
 */
export async function checkForUpdate({ swUrl, registration, isOnline, fetchScript }: UpdateCheckOptions): Promise<boolean> {
  if (registration.installing || !isOnline()) return false;
  try {
    const response = await fetchScript(swUrl, { cache: "no-store", headers: { "cache-control": "no-cache" } });
    if (response.status !== 200) return false;
    await registration.update();
    return true;
  } catch {
    // because a failed check (flaky network, server hiccup) is harmless: the next one runs on the
    // next visibility change or within the hour.
    return false;
  }
}

/** What a tab does when its service worker controller changes. */
export type ControllerChangeAction = "reload" | "offer-reload" | "ignore";

/**
 * Decides how to react to `controllerchange`: reload only when this tab asked for the update;
 * offer a reload when another tab activated a new version under it; ignore the first install.
 */
export function controllerChangeAction({ hadController, updateRequested }: { readonly hadController: boolean; readonly updateRequested: boolean }): ControllerChangeAction {
  if (updateRequested) return "reload";
  if (!hadController) return "ignore";
  return "offer-reload";
}

/**
 * Decides whether a failed chunk import (`vite:preloadError`) may reload the page: yes, unless the
 * last such reload happened within {@link PRELOAD_RELOAD_WINDOW_MS} (no reload loop).
 *
 * @param lastReloadAt - ms timestamp of the last preload-error reload, or null if none.
 */
export function shouldReloadAfterPreloadError(lastReloadAt: number | null, now: number): boolean {
  return lastReloadAt === null || now - lastReloadAt > PRELOAD_RELOAD_WINDOW_MS;
}

/** Checks for a new version every hour and on return to the foreground (at most every 5 min). */
function scheduleUpdateChecks(swUrl: string, registration: UpdatableRegistration): void {
  let lastCheckAt = Date.now(); // registering has just checked
  const check = (): void => {
    lastCheckAt = Date.now();
    void checkForUpdate({ swUrl, registration, isOnline: () => navigator.onLine, fetchScript: (url, init) => fetch(url, init) });
  };
  setInterval(check, UPDATE_CHECK_INTERVAL_MS);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && Date.now() - lastCheckAt >= UPDATE_CHECK_MIN_GAP_MS) check();
  });
}

/**
 * After a deploy GitHub Pages no longer has the old hashed chunks; a page still running the old code
 * fails on its next lazy import (Help, Settings…). Reload once to get the new HTML (vite.dev "Load
 * Error Handling"); a repeat within a minute falls through to the error screen.
 */
function handlePreloadErrors(): void {
  window.addEventListener("vite:preloadError", (event) => {
    const now = Date.now();
    if (!shouldReloadAfterPreloadError(readPreloadReloadAt(), now)) return;
    // because without the guard saved a reload could loop forever: let the error surface instead
    if (!writePreloadReloadAt(now)) return;
    event.preventDefault();
    location.reload();
  });
}

/** Registers the service worker and wires update offers, periodic checks and stale-chunk recovery. */
export function initPwa(events: PwaEvents): void {
  handlePreloadErrors();
  if (!("serviceWorker" in navigator)) return;
  let hadController = navigator.serviceWorker.controller !== null;
  let updateRequested = false;
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      events.onUpdateReady(() => {
        updateRequested = true;
        // A tab without a controller (opened with a hard reload) gets no controllerchange: the new
        // worker activates without it, so reload it directly once skip-waiting is sent.
        const isControlled = navigator.serviceWorker.controller !== null;
        void updateSW(true).then(() => {
          if (!isControlled) location.reload();
        });
      });
    },
    onNeedReload() {
      // Intentionally empty: the plugin's default reloads EVERY open tab when one tab applies the
      // update; the controllerchange listener below decides per tab instead (pwa §5 multi-tab).
    },
    onOfflineReady: events.onOfflineReady,
    onRegisteredSW(swUrl, registration) {
      if (registration) scheduleUpdateChecks(swUrl, registration);
    },
    onRegisterError(error: unknown) {
      console.warn("Service worker registration failed", error);
    },
  });
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    const action = controllerChangeAction({ hadController, updateRequested });
    hadController = true;
    if (action === "reload") location.reload();
    // Another tab activated the new version; this tab still runs the old code until the user agrees.
    if (action === "offer-reload") events.onUpdateReady(() => { location.reload(); });
  });
}
