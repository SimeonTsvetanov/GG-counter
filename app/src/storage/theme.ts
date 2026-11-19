// The theme choice under `gg-counter:v1:theme`: "light" or "dark" saved as JSON (like the forge's
// prefs and public/theme-init.js expect); "system" is the absence of the key, as before T-07.
// Used by the theme provider, the migration and export/import.
import { STORAGE_KEYS } from "./keys";
import { readRaw, removeRaw, writeRaw, type StorageResult } from "./local-store";

/** A theme choice; `system` follows the operating system. */
export type Theme = "light" | "dark" | "system";

/** A theme that is saved; `system` is stored as no value. */
export type SavedTheme = Exclude<Theme, "system">;

/** Returns true when `value` is one of the theme choices. */
export function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

/** Returns the string stored for a saved theme. */
export function encodeTheme(theme: SavedTheme): string {
  return JSON.stringify(theme);
}

/** Returns the saved theme choice, or null when nothing (or an unreadable value) is saved. */
export function readTheme(): Theme | null {
  const raw = readRaw(STORAGE_KEYS.theme);
  if (raw === null) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // because an unreadable value means no choice: the app follows the system theme
    return null;
  }
  return isTheme(parsed) ? parsed : null;
}

/** Saves `theme`; "system" removes the saved value, as the pre-forge app did. */
export function writeTheme(theme: Theme): StorageResult {
  if (theme === "system") return removeRaw(STORAGE_KEYS.theme);
  return writeRaw(STORAGE_KEYS.theme, encodeTheme(theme));
}
