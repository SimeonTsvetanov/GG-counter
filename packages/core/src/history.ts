// Score history (SPEC 1.1, F15): every score change of a player is an entry. A run of quick taps in the
// same direction becomes one entry, and only the newest entries are kept — the older ones are folded
// into the score, so `score === scoreBase(player) + sum of the deltas` holds by construction.
import type { GameState, Player, ScoreEntry } from "./game.ts";

/** Most entries kept per player; older ones are folded into {@link scoreBase} (DECISIONS 2026-11-20). */
export const MAX_HISTORY_ENTRIES = 50;

/**
 * Longest pause between two changes of the same player in the same direction that still merge into
 * one entry, in milliseconds (counting with +1 taps is one change; DECISIONS 2026-11-20).
 */
export const MERGE_WINDOW_MS = 3000;

/** A score change to record: the amount plus the entry id and time the caller made for it. */
export interface ScoreChange {
  /** The points to add (negative subtracts). */
  readonly delta: number;
  /** Id of the new entry (unused when the change merges into the previous entry). */
  readonly entryId: string;
  /** ISO 8601 time of the change. */
  readonly at: string;
}

/** Returns the sum of the deltas in `history`. */
export function sumOfDeltas(history: readonly ScoreEntry[]): number {
  return history.reduce((sum, entry) => sum + entry.delta, 0);
}

/** Returns the part of the player's score that is not in the history (older, folded entries and pre-1.1 points). */
export function scoreBase(player: Player): number {
  return player.score - sumOfDeltas(player.history);
}

/** Returns `history` without its oldest entries beyond {@link MAX_HISTORY_ENTRIES}. */
export function capHistory(history: readonly ScoreEntry[]): readonly ScoreEntry[] {
  return history.length > MAX_HISTORY_ENTRIES ? history.slice(-MAX_HISTORY_ENTRIES) : history;
}

/** True when `change` continues the run that ended with `last` (same direction, within the window). */
function continuesRun(last: ScoreEntry, change: ScoreChange): boolean {
  const pause = Date.parse(change.at) - Date.parse(last.at);
  // because a clock set back (pause < 0) must not merge an old entry with a new one
  return Math.sign(last.delta) === Math.sign(change.delta) && pause >= 0 && pause <= MERGE_WINDOW_MS;
}

/**
 * Returns `history` with `change` recorded: merged into the last entry when it continues that run and
 * `mayMerge` is true (no other player changed in between), else appended and the list capped.
 */
export function recordChange(history: readonly ScoreEntry[], change: ScoreChange, mayMerge: boolean): readonly ScoreEntry[] {
  const last = history.at(-1);
  if (mayMerge && last !== undefined && continuesRun(last, change)) {
    return [...history.slice(0, -1), { id: last.id, delta: last.delta + change.delta, at: change.at }];
  }
  return capHistory([...history, { id: change.entryId, delta: change.delta, at: change.at }]);
}

/**
 * Returns the id of the player whose newest history entry is the newest in the game, or null when no
 * player has an entry (the last-scored highlight, SPEC 1.1 F17).
 *
 * @remarks Compares entry times; on equal times the player added first wins. Removing that entry
 * moves the highlight to the player with the next newest entry.
 */
export function lastScoredPlayerId(game: GameState): string | null {
  let newest: { readonly id: string; readonly time: number } | null = null;
  for (const player of game.players) {
    const last = player.history.at(-1);
    if (last === undefined) continue;
    const time = Date.parse(last.at);
    if (newest === null || time > newest.time) newest = { id: player.id, time };
  }
  return newest === null ? null : newest.id;
}
