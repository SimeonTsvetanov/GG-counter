// Safe access to this browser's localStorage for the storage modules only (this folder and app/src/storage). Every call is
// wrapped, so private mode, disabled storage or a full quota never crash the app: a value that cannot
// be saved lives in memory for this session and the caller gets a typed result saying so.

/** Why a value could not be saved in this browser. */
export type StorageErrorCode = "STORAGE_UNAVAILABLE" | "STORAGE_FULL";

/** Whether a write or removal reached the browser's storage (`ok: false` = persistence is off). */
export type StorageResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: { readonly code: StorageErrorCode; readonly message: string } };

const MESSAGES: Record<StorageErrorCode, string> = {
  STORAGE_UNAVAILABLE: "This browser does not allow saving here (private mode or storage turned off). Changes last until the page is closed.",
  STORAGE_FULL: "This browser's storage is full. Changes last until the page is closed; export your data or clear old items.",
};

const SAVED: StorageResult = { ok: true };

/** Values that could not be persisted, by key; read before the browser's storage for this session. */
const memory = new Map<string, string>();

/** Returns a failed {@link StorageResult} with the message for `code`. */
function failure(code: StorageErrorCode): StorageResult {
  return { ok: false, error: { code, message: MESSAGES[code] } };
}

/** Returns the browser's localStorage, or null when there is none or it is blocked. */
function backend(): Storage | null {
  try {
    // because the DOM types say the global always exists, but it is missing outside browsers (tests)
    const { localStorage: storage } = globalThis as { localStorage?: Storage };
    return storage ?? null;
  } catch {
    // because reading the property throws a SecurityError when storage is turned off
    return null;
  }
}

/** True when `error` is the browser's "storage is full" error (name differs in old Firefox). */
function isQuotaError(error: unknown): boolean {
  return error instanceof DOMException && (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED");
}

/** Returns the stored string for `key` (this session's unsaved value first), or null when there is none. */
export function readRaw(key: string): string | null {
  const unsaved = memory.get(key);
  if (unsaved !== undefined) return unsaved;
  const storage = backend();
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch {
    // because a blocked storage reads as empty: the app starts with defaults, as with nothing saved
    return null;
  }
}

/**
 * Saves `value` under `key` and reads it back; it counts as saved only when the read-back is equal.
 *
 * @remarks On any failure the value is kept in memory for this session (the app keeps working) and
 * a value that did not read back equal is removed from storage, so it can never win over an older one.
 */
export function writeRaw(key: string, value: string): StorageResult {
  const storage = backend();
  if (!storage) {
    memory.set(key, value);
    return failure("STORAGE_UNAVAILABLE");
  }
  try {
    storage.setItem(key, value);
    if (storage.getItem(key) !== value) {
      storage.removeItem(key);
      memory.set(key, value);
      return failure("STORAGE_UNAVAILABLE");
    }
  } catch (error: unknown) {
    memory.set(key, value);
    return failure(isQuotaError(error) ? "STORAGE_FULL" : "STORAGE_UNAVAILABLE");
  }
  memory.delete(key);
  return SAVED;
}

/** Removes `key` from this session's memory and from the browser's storage. */
export function removeRaw(key: string): StorageResult {
  memory.delete(key);
  const storage = backend();
  if (!storage) return SAVED; // because nothing can have been persisted in a storage that is not there
  try {
    storage.removeItem(key);
    return SAVED;
  } catch {
    return failure("STORAGE_UNAVAILABLE");
  }
}

/** Returns every key in the browser's storage and in this session's memory (all apps on the origin). */
export function listKeys(): string[] {
  const keys = new Set(memory.keys());
  const storage = backend();
  if (!storage) return [...keys];
  try {
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key !== null) keys.add(key);
    }
  } catch {
    // because a blocked storage has no keys to list; this session's memory still counts
  }
  return [...keys];
}
