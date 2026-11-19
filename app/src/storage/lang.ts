// The UI language chosen in Settings under `gg-counter:v1:lang` (PLAN T-09), saved as JSON like the
// other values of the namespace. No value = no choice yet: the app starts in English (no browser detection).
// Used by app/src/i18n and by export/import (index.ts).
import { app, type LanguageCode } from "../config";
import { STORAGE_KEYS } from "./keys";
import { readRaw, writeRaw, type StorageResult } from "./local-store";

/** Returns true when `value` is one of the app's UI languages (app.config.ts `languages`). */
export function isLanguage(value: unknown): value is LanguageCode {
  return typeof value === "string" && (app.languages as readonly string[]).includes(value);
}

/** Returns the saved language choice, or null when none (or an unreadable or unknown value) is saved. */
export function readLanguage(): LanguageCode | null {
  const raw = readRaw(STORAGE_KEYS.lang);
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    return isLanguage(parsed) ? parsed : null;
  } catch {
    // because an unreadable value means no choice: the app starts in English
    return null;
  }
}

/** Saves `lang` as the user's choice (English too: an explicit choice, kept in the export). */
export function writeLanguage(lang: LanguageCode): StorageResult {
  return writeRaw(STORAGE_KEYS.lang, JSON.stringify(lang));
}
