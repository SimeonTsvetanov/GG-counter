// Score transitions (SPEC F3, F6; 1.1 F13–F16; limits SPEC §7): change a score (recorded in the player's
// history), remove one history entry and put it back (Restore), reset one player's score, reset all scores.
import type { GameState, Player, ScoreEntry } from "./game.ts";
import { capHistory, lastScoredPlayerId, recordChange, type ScoreChange } from "./history.ts";
import { MAX_SCORE, MIN_SCORE } from "./limits.ts";
import { fail, ok, type Failure, type Result } from "./result.ts";

/** Why a score change was rejected. */
export type ScoreErrorCode = "SCORE_INVALID" | "SCORE_OUT_OF_RANGE" | "PLAYER_NOT_FOUND";

/** Why {@link removeScoreEntry} was rejected. */
export type ScoreEntryErrorCode = "SCORE_OUT_OF_RANGE" | "PLAYER_NOT_FOUND" | "SCORE_ENTRY_NOT_FOUND";

/** Why {@link restoreScoreEntry} was rejected. */
export type RestoreEntryErrorCode = "SCORE_INVALID" | "SCORE_OUT_OF_RANGE" | "PLAYER_NOT_FOUND" | "SCORE_ENTRY_EXISTS";

const PLAYER_NOT_FOUND = "This player is no longer in the game.";

/** True when `score` lies within {@link MIN_SCORE}…{@link MAX_SCORE}. */
function isInRange(score: number): boolean {
  return score >= MIN_SCORE && score <= MAX_SCORE;
}

/** Returns why the score may not move from `current` to `next`, or null when it may. */
function refuseScore(current: number, next: number): Failure<"SCORE_INVALID" | "SCORE_OUT_OF_RANGE"> | null {
  if (!Number.isFinite(next)) return fail("SCORE_INVALID", "Enter a number.");
  // Saved games may hold scores beyond the limits (they load unchanged): such a score may still
  // move back towards the range, but never further out.
  if (!isInRange(next) && Math.abs(next) >= Math.abs(current)) {
    return fail("SCORE_OUT_OF_RANGE", `Scores go from ${String(MIN_SCORE)} to ${String(MAX_SCORE)}.`);
  }
  return null;
}

/** Returns the game with player `id` replaced by `update(player)`; the caller checked the id exists. */
function withPlayer(game: GameState, id: string, update: (player: Player) => Player): GameState {
  return { ...game, players: game.players.map((player) => (player.id === id ? update(player) : player)) };
}

/**
 * Returns the game with `change.delta` added to player `id`'s score (negative subtracts) and the
 * change recorded in that player's history.
 *
 * @remarks A delta of 0 changes nothing (no entry). The change merges into the player's last entry when
 * that player was also the last one scored and it continues the same run (history.ts, `MERGE_WINDOW_MS`).
 */
export function adjustScore(game: GameState, id: string, change: ScoreChange): Result<GameState, ScoreErrorCode> {
  const player = game.players.find((candidate) => candidate.id === id);
  if (player === undefined) return fail("PLAYER_NOT_FOUND", PLAYER_NOT_FOUND);
  const score = player.score + change.delta;
  const refused = refuseScore(player.score, score);
  if (refused !== null) return refused;
  if (change.delta === 0) return ok(game);
  const mayMerge = lastScoredPlayerId(game) === id;
  return ok(withPlayer(game, id, (current) => ({ ...current, score, history: recordChange(current.history, change, mayMerge) })));
}

/**
 * Returns the game without history entry `entryId` of player `playerId`; that entry's delta is taken
 * off the score (a wrong entry is undone with one press — SPEC 1.1 F16).
 *
 * @remarks Refused with SCORE_OUT_OF_RANGE when the score would leave the limits by more than it already
 * does — the same rule as {@link adjustScore}; the entry then stays.
 */
export function removeScoreEntry(game: GameState, playerId: string, entryId: string): Result<GameState, ScoreEntryErrorCode> {
  const player = game.players.find((candidate) => candidate.id === playerId);
  if (player === undefined) return fail("PLAYER_NOT_FOUND", PLAYER_NOT_FOUND);
  const entry = player.history.find((candidate) => candidate.id === entryId);
  if (entry === undefined) return fail("SCORE_ENTRY_NOT_FOUND", "This change is no longer in the history.");
  const score = player.score - entry.delta;
  const refused = refuseScore(player.score, score);
  // because a finite score minus a finite delta stays finite, only the range can refuse it
  if (refused !== null) return fail("SCORE_OUT_OF_RANGE", refused.error.message);
  return ok(withPlayer(game, playerId, (current) => ({ ...current, score, history: current.history.filter((item) => item !== entry) })));
}

/**
 * Returns the game with a removed history `entry` of player `playerId` put back at position `index` (oldest
 * first; clamped to the history's length) and its delta added to the score again — the Restore of the
 * history sheet (SPEC 1.1 F16), so `removeScoreEntry` followed by this gives back the same game.
 *
 * @remarks Refused with SCORE_ENTRY_EXISTS when the history already holds that id, SCORE_INVALID for a
 * delta that is 0 or not finite, and SCORE_OUT_OF_RANGE by the same rule as {@link adjustScore}. The
 * history is capped again, so an entry restored into a full history may fold the oldest one into the base.
 */
export function restoreScoreEntry(game: GameState, playerId: string, entry: ScoreEntry, index: number): Result<GameState, RestoreEntryErrorCode> {
  const player = game.players.find((candidate) => candidate.id === playerId);
  if (player === undefined) return fail("PLAYER_NOT_FOUND", PLAYER_NOT_FOUND);
  if (player.history.some((candidate) => candidate.id === entry.id)) return fail("SCORE_ENTRY_EXISTS", "This change is already in the history.");
  if (entry.delta === 0) return fail("SCORE_INVALID", "Enter a number.");
  const score = player.score + entry.delta;
  const refused = refuseScore(player.score, score);
  if (refused !== null) return refused;
  const at = Math.min(Math.max(0, Math.trunc(index)), player.history.length);
  const history = capHistory([...player.history.slice(0, at), entry, ...player.history.slice(at)]);
  return ok(withPlayer(game, playerId, (current) => ({ ...current, score, history })));
}

/** Returns the game with player `id`'s score set to 0 and their history emptied; the player stays (SPEC 1.1 F14). */
export function resetPlayerScore(game: GameState, id: string): Result<GameState, "PLAYER_NOT_FOUND"> {
  if (!game.players.some((player) => player.id === id)) return fail("PLAYER_NOT_FOUND", PLAYER_NOT_FOUND);
  return ok(withPlayer(game, id, (player) => ({ ...player, score: 0, history: [] })));
}

/** Returns the game with every score set to 0 and every history emptied; the players stay (SPEC F6, 1.1 F13). */
export function resetScores(game: GameState): GameState {
  return { ...game, players: game.players.map((player) => ({ ...player, score: 0, history: [] })) };
}
