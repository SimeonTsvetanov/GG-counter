// The saved game in this browser's localStorage (key `gg-counter/state`, a contract with installed
// copies — SPEC §4). This module only reads and writes; checking the value is core's parseSavedState.
import { GAME_VERSION, createEmptyGame, parseSavedState, type GameState } from "gg-counter-core";

const STORAGE_KEY = "gg-counter/state";

/** Reads the saved game, dropping invalid players; a missing or unreadable entry gives a new empty game. */
export function loadState(): GameState {
  const now = new Date().toISOString();
  if (typeof window === "undefined") {
    return createEmptyGame(now);
  }

  try {
    const item = window.localStorage.getItem(STORAGE_KEY);

    if (!item) {
      return createEmptyGame(now);
    }

    const result = parseSavedState(JSON.parse(item), now);
    if (!result.ok) {
      console.error("Failed to read state from storage", result.error);
      return createEmptyGame(now);
    }
    return result.value;
  } catch (error) {
    console.error("Failed to read state from storage", error);
    return createEmptyGame(now);
  }
}

/** Saves the game with the current version and timestamp; a storage error is logged, never thrown. */
export function saveState(getState: () => GameState): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const state = getState();
    const payload: GameState = {
      ...state,
      version: GAME_VERSION,
      lastUpdated: new Date().toISOString(),
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error("Failed to persist state", error);
  }
}

/** Removes the saved game from this browser. */
export function clearState(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}
