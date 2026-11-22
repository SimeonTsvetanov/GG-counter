// This tab's sessionStorage, for the one value that must survive a reload but not the tab: when the
// app last reloaded itself after a failed chunk load (app/src/ui/pwa.ts, pwa §5). Blocked or missing
// storage never throws; the caller gets "unknown" / "not saved" and then does not reload.
import { KEY_PREFIX } from "gg-counter-miniapp/storage/keys";

/** Key of the time (ms) of the last reload after a `vite:preloadError`. */
export const PRELOAD_RELOAD_KEY = `${KEY_PREFIX}preload-reload`;

/** Returns this tab's sessionStorage, or null when there is none or it is blocked. */
function sessionBackend(): Storage | null {
  try {
    // because the DOM types say the global always exists, but it is missing outside browsers (tests)
    const { sessionStorage: storage } = globalThis as { sessionStorage?: Storage };
    return storage ?? null;
  } catch {
    // because reading the property throws a SecurityError when storage is turned off
    return null;
  }
}

/** Returns when this tab last reloaded after a failed chunk load (ms), or null when it has not. */
export function readPreloadReloadAt(): number | null {
  try {
    const value = Number(sessionBackend()?.getItem(PRELOAD_RELOAD_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    // because a blocked storage just means "no reload recorded"
    return null;
  }
}

/**
 * Records a reload after a failed chunk load at `now` (ms).
 *
 * @returns false when it could not be saved — the caller must not reload then, or it could loop.
 */
export function writePreloadReloadAt(now: number): boolean {
  const storage = sessionBackend();
  if (!storage) return false;
  try {
    storage.setItem(PRELOAD_RELOAD_KEY, String(now));
    return storage.getItem(PRELOAD_RELOAD_KEY) === String(now);
  } catch {
    // because a full or blocked storage cannot hold the guard
    return false;
  }
}
