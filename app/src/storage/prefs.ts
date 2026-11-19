// Small app-shell preferences under `gg-counter:v1:*` (PLAN T-08): the version whose What's new the
// user has seen (app-shell §5). Removed with everything else by clearData (same namespace).
import { KEY_PREFIX } from "./keys";
import { readRaw, writeRaw, type StorageResult } from "./local-store";

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
