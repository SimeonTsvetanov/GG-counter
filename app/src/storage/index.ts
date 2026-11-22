// The storage module's "my data" functions (engineering → browser-storage §3, §8): export, import and
// clear this app's data. Called by Settings and the error screen (PLAN T-08). The game, theme, language and migration
// have their own files next to this one; nothing outside app/src/storage touches localStorage (ESLint rule).
import { checkSavedGame, type GameState, type Result } from "gg-counter-core";
import { APP_ID, STORAGE_KEYS, isOwnKey } from "gg-counter-miniapp/storage/keys";
import { listKeys, readRaw, removeRaw, writeRaw, type StorageErrorCode, type StorageResult } from "gg-counter-miniapp/storage/local-store";
import { encodeGame, readGame } from "gg-counter-miniapp/storage/game";
import { isTheme, readTheme, writeTheme, type Theme } from "gg-counter-miniapp/storage/theme";
import { isLanguage, readLanguage, writeLanguage } from "./lang";
import type { LanguageCode } from "../config";

/**
 * The export format version; bumped (with an import migration) when the file's shape changes.
 *
 * @remarks Still 1 in GG Counter 1.1: the score history is an added field of each player, versioned by the
 * game's own `version` (2), so 1.0.0 files import unchanged and a 1.0.0 app still imports a 1.1 file
 * (without the history) — DECISIONS 2026-11-20.
 */
export const EXPORT_SCHEMA_VERSION = 1;

/** Largest import accepted, in characters: a 50-player game with full histories is ~250 KB, so this bounds a hostile file. */
export const MAX_IMPORT_CHARS = 1_000_000;

/** The app's data as saved in an export file. */
export interface AppData {
  readonly state: GameState;
  readonly theme: Theme;
  /**
   * The UI language chosen in Settings (PLAN T-09); null = no choice saved. Files exported before
   * T-09 have no `lang` and import as null, which keeps the device's current choice.
   */
  readonly lang: LanguageCode | null;
}

/** An export file: `{ app, schemaVersion, exportedAt, data }`. */
export interface DataExport {
  readonly app: string;
  readonly schemaVersion: typeof EXPORT_SCHEMA_VERSION;
  readonly exportedAt: string;
  readonly data: AppData;
}

/** Why an import was rejected; nothing was changed in any case. */
export type ImportErrorCode =
  | "IMPORT_TOO_BIG"
  | "IMPORT_NOT_JSON"
  | "IMPORT_NOT_THIS_APP"
  | "IMPORT_UNSUPPORTED_VERSION"
  | "IMPORT_INVALID"
  | StorageErrorCode;

/** What {@link checkImport} and {@link importData} return. */
export type ImportResult = Result<AppData, ImportErrorCode>;

/** Returns a rejected import with a stable code and an English message. */
function rejected(code: ImportErrorCode, message: string): ImportResult {
  return { ok: false, error: { code, message } };
}

/** True for a plain object (not null, not an array); its fields are still unchecked. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Returns this app's data as an export object (the caller turns it into a file).
 *
 * @param now - ISO 8601 time written as `exportedAt`; defaults to the current time.
 */
export function exportData(now: string = new Date().toISOString()): DataExport {
  return {
    app: APP_ID,
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt: now,
    data: { state: readGame(now), theme: readTheme() ?? "system", lang: readLanguage() },
  };
}

/**
 * Returns the data in an export file's text, or why it cannot be imported; checks every field and
 * changes nothing (Settings shows the result before asking to replace the game).
 *
 * @param now - ISO 8601 time for a game without `lastUpdated`; defaults to the current time.
 */
export function checkImport(text: string, now: string = new Date().toISOString()): ImportResult {
  if (text.length > MAX_IMPORT_CHARS) return rejected("IMPORT_TOO_BIG", "The file is too big to be a GG Counter export.");
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return rejected("IMPORT_NOT_JSON", "The file is not a GG Counter export (it is not JSON).");
  }
  if (!isRecord(raw)) return rejected("IMPORT_INVALID", "The file is not a GG Counter export.");
  if (raw.app !== APP_ID) return rejected("IMPORT_NOT_THIS_APP", "The file was exported by another app.");
  if (raw.schemaVersion !== EXPORT_SCHEMA_VERSION) return rejected("IMPORT_UNSUPPORTED_VERSION", "The file comes from a newer or unknown version of GG Counter.");
  const data = raw.data;
  if (typeof raw.exportedAt !== "string" || !isRecord(data) || !isTheme(data.theme) || !isRecord(data.state)) {
    return rejected("IMPORT_INVALID", "The file is damaged: some of its data is missing.");
  }
  const lang = data.lang ?? null;
  if (lang !== null && !isLanguage(lang)) return rejected("IMPORT_INVALID", "The file is damaged: its language is unknown.");
  // Strict: an import never applies part of a game (a dropped player or history entry refuses the file).
  const game = checkSavedGame(data.state, now);
  if (!game.ok) return rejected("IMPORT_INVALID", `The file is damaged. ${game.error.message}`);
  return { ok: true, value: { state: game.value, theme: data.theme, lang } };
}

/** Puts `previous` back under `key` (null = no value). */
function restore(key: string, previous: string | null): void {
  if (previous === null) removeRaw(key);
  else writeRaw(key, previous);
}

/**
 * Replaces this app's data with the data in an export file's text — all of it or nothing.
 *
 * @param text - The file's contents.
 * @param now - ISO 8601 time for a game without `lastUpdated`; defaults to the current time.
 * @returns The imported data (for the UI to show), or a typed error; on any error nothing is changed.
 */
export function importData(text: string, now: string = new Date().toISOString()): ImportResult {
  const parsed = checkImport(text, now);
  if (!parsed.ok) return parsed;
  const { state, theme, lang } = parsed.value;
  const previous = { state: readRaw(STORAGE_KEYS.state), theme: readRaw(STORAGE_KEYS.theme), lang: readRaw(STORAGE_KEYS.lang) };
  // The game goes first: it is the big value, so a full storage fails before anything changed.
  const savedGame = writeRaw(STORAGE_KEYS.state, encodeGame(state));
  const savedTheme = savedGame.ok ? writeTheme(theme) : savedGame;
  const saved = savedTheme.ok && lang !== null ? writeLanguage(lang) : savedTheme;
  if (saved.ok) return parsed;
  for (const key of ["state", "theme", "lang"] as const) restore(STORAGE_KEYS[key], previous[key]);
  return rejected(saved.error.code, saved.error.message);
}

/**
 * Removes this app's data: every `gg-counter:v1:*` key and the pre-forge keys — nothing else on the
 * shared origin (other apps' keys stay untouched). The caller asks the user first.
 *
 * @returns `ok: false` when the browser refused a removal.
 */
export function clearData(): StorageResult {
  let result: StorageResult = { ok: true };
  for (const key of listKeys().filter(isOwnKey)) {
    const removed = removeRaw(key);
    if (!removed.ok) result = removed;
  }
  return result;
}
