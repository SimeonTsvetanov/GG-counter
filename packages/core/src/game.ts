// The game model: the players with their scores, in the shape saved under `gg-counter/state`
// since the pre-forge app (SPEC §4) — field names are a contract with existing saved games.

/** The saved-game format version written by the app. */
export const GAME_VERSION = 1;

/** One player at the table. */
export interface Player {
  readonly id: string;
  readonly name: string;
  /** Finite; may be fractional or outside the limits in games saved before the limits existed. */
  readonly score: number;
  /** ISO 8601 time the player was added. */
  readonly createdAt: string;
}

/** The whole game; players are in the order they were added. */
export interface GameState {
  readonly players: readonly Player[];
  /** ISO 8601 time of the last save. */
  readonly lastUpdated: string;
  readonly version: number;
}

/** Returns a game with no players, stamped with `now` (ISO 8601). */
export function createEmptyGame(now: string): GameState {
  return { players: [], lastUpdated: now, version: GAME_VERSION };
}
