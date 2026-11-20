// The saved game under `gg-counter:v1:state` (the JSON shape of the pre-forge `gg-counter/state`, SPEC §4,
// plus each player's score history since 1.1 — game version 2, read from version 1 on load). Used by the
// use-game-state hook, the migration and export/import. The stored value is untrusted: it is checked by
// core's parseSavedState every time it is read.
import { GAME_VERSION, createEmptyGame, parseSavedState, type GameState } from "gg-counter-core";
import { STORAGE_KEYS } from "./keys";
import { readRaw, removeRaw, writeRaw, type StorageResult } from "./local-store";

/**
 * Returns the game in the stored string `raw`, or null when it is not JSON or not a game.
 *
 * @param now - ISO 8601 time used when the stored `lastUpdated` is missing.
 * @remarks Invalid player entries are dropped and the valid ones kept (core's parseSavedState).
 */
export function decodeGame(raw: string, now: string): GameState | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // because broken JSON is a value we cannot read, like any other invalid one
    return null;
  }
  const result = parseSavedState(parsed, now);
  return result.ok ? result.value : null;
}

/** Returns the string stored for `game` (its fields as they are). */
export function encodeGame(game: GameState): string {
  return JSON.stringify(game);
}

/**
 * Returns the saved game; nothing saved or an unreadable value gives an empty game, as before T-07.
 *
 * @param now - ISO 8601 time for an empty game or a missing `lastUpdated`; defaults to the current time.
 */
export function readGame(now: string = new Date().toISOString()): GameState {
  const raw = readRaw(STORAGE_KEYS.state);
  if (raw === null) return createEmptyGame(now);
  return decodeGame(raw, now) ?? createEmptyGame(now);
}

/**
 * Saves `game` stamped with the current format version and `now` as `lastUpdated`.
 *
 * @returns `ok: false` when the browser did not keep it (the game then lives in memory this session).
 */
export function writeGame(game: GameState, now: string = new Date().toISOString()): StorageResult {
  const stamped: GameState = { ...game, version: GAME_VERSION, lastUpdated: now };
  return writeRaw(STORAGE_KEYS.state, encodeGame(stamped));
}

/** Removes the saved game (the pre-forge key is not touched — PLAN T-07). */
export function removeGame(): StorageResult {
  return removeRaw(STORAGE_KEYS.state);
}
