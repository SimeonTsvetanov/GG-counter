// The game model: the players with their scores, in the shape saved under `gg-counter/state`
// since the pre-forge app (SPEC §4) — field names are a contract with existing saved games.
// Version 2 (SPEC 1.1, F15) adds each player's score history; `score` stays the total, so an
// older app that ignores the history still reads the right scores.

/** The saved-game format version written by the app (1 = pre-1.1 games without score history). */
export const GAME_VERSION = 2;

/** One recorded change of a player's score (+1/−1 taps, a custom amount). */
export interface ScoreEntry {
  /** Unique within the player's history; made by the caller (the reducer stays pure). */
  readonly id: string;
  /** The points added (negative = subtracted); finite and never 0. */
  readonly delta: number;
  /** ISO 8601 time of the change (of the last tap when taps were merged). */
  readonly at: string;
}

/** One player at the table. */
export interface Player {
  readonly id: string;
  readonly name: string;
  /**
   * The total. Finite; may be fractional or outside the limits in games saved before the limits
   * existed. Always `scoreBase(player) + sum(history deltas)` — see history.ts.
   */
  readonly score: number;
  /** ISO 8601 time the player was added. */
  readonly createdAt: string;
  /** The most recent score changes, oldest first; at most `MAX_HISTORY_ENTRIES`. */
  readonly history: readonly ScoreEntry[];
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
