// Small app-shell preferences under `gg-counter:v1:*` (PLAN T-08): the version whose What's new the
// user has seen (app-shell §5). Removed with everything else by clearData (same namespace).
import { KEY_PREFIX } from "gg-counter-miniapp/storage/keys";
import { readRaw, removeRaw, writeRaw, type StorageResult } from "gg-counter-miniapp/storage/local-store";

/** Key of the last version whose What's new was shown or skipped on a first visit. */
export const LAST_SEEN_VERSION_KEY = `${KEY_PREFIX}last-seen-version`;

/** Returns the version saved as seen, or null on a first visit (or an unreadable value). */
export function readLastSeenVersion(): string | null {
  const raw = readRaw(LAST_SEEN_VERSION_KEY);
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "string" ? parsed : null;
  } catch {
    // because an unreadable value counts as "never seen": What's new is then skipped once, not lost
    return null;
  }
}

/** Saves `version` as seen (JSON string, like every value of the namespace). */
export function writeLastSeenVersion(version: string): StorageResult {
  return writeRaw(LAST_SEEN_VERSION_KEY, JSON.stringify(version));
}

/**
 * The game screen's prefs (contract `storage.prefs`, miniapp/context.ts): JSON values under
 * `gg-counter:v1:<key>`, through the same storage module as everything else.
 * @remarks The screen keeps its game in its own storage module and uses none today; the contract
 * requires the service.
 */
export const screenPrefs = {
  /** Returns the value saved under `key`, or `fallback` when none (or an unreadable value) is saved. */
  get<T>(key: string, fallback: T): T {
    const raw = readRaw(`${KEY_PREFIX}${key}`);
    if (raw === null) return fallback;
    try {
      // because the contract types prefs by the caller's fallback; the caller saved this value itself
      return JSON.parse(raw) as T;
    } catch {
      // because an unreadable value counts as nothing saved
      return fallback;
    }
  },
  /** Saves `value` as JSON; false when the browser did not keep it. */
  set(key: string, value: unknown): boolean {
    return writeRaw(`${KEY_PREFIX}${key}`, JSON.stringify(value)).ok;
  },
  /** Removes the value saved under `key`. */
  remove(key: string): void {
    removeRaw(`${KEY_PREFIX}${key}`);
  },
};
