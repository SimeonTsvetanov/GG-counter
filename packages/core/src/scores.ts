// Score transitions: adjust by an amount, set, reset all (SPEC F3, F6; limits SPEC §7).
import type { GameState } from "./game.ts";
import { MAX_SCORE, MIN_SCORE } from "./limits.ts";
import { fail, ok, type Result } from "./result.ts";

/** Why a score change was rejected. */
export type ScoreErrorCode = "SCORE_INVALID" | "SCORE_OUT_OF_RANGE" | "PLAYER_NOT_FOUND";

/** True when `score` lies within {@link MIN_SCORE}…{@link MAX_SCORE}. */
function isInRange(score: number): boolean {
  return score >= MIN_SCORE && score <= MAX_SCORE;
}

/** Returns the game with player `id`'s score changed to `next` when `next` is allowed from that player's current score. */
function changeScore(game: GameState, id: string, next: (current: number) => number): Result<GameState, ScoreErrorCode> {
  const player = game.players.find((candidate) => candidate.id === id);
  if (player === undefined) return fail("PLAYER_NOT_FOUND", "This player is no longer in the game.");
  const score = next(player.score);
  if (!Number.isFinite(score)) return fail("SCORE_INVALID", "Enter a number.");
  // Saved games may hold scores beyond the limits (they load unchanged): such a score may still
  // move back towards the range, but never further out.
  if (!isInRange(score) && Math.abs(score) >= Math.abs(player.score)) {
    return fail("SCORE_OUT_OF_RANGE", `Scores go from ${String(MIN_SCORE)} to ${String(MAX_SCORE)}.`);
  }
  return ok({ ...game, players: game.players.map((candidate) => (candidate.id === id ? { ...candidate, score } : candidate)) });
}

/** Returns the game with `delta` added to player `id`'s score (negative subtracts). */
export function adjustScore(game: GameState, id: string, delta: number): Result<GameState, ScoreErrorCode> {
  return changeScore(game, id, (current) => current + delta);
}

/** Returns the game with player `id`'s score set to `score`. */
export function setScore(game: GameState, id: string, score: number): Result<GameState, ScoreErrorCode> {
  // A typed score is new input: it must be in range even when the saved one is not.
  if (Number.isFinite(score) && !isInRange(score)) return fail("SCORE_OUT_OF_RANGE", `Scores go from ${String(MIN_SCORE)} to ${String(MAX_SCORE)}.`);
  return changeScore(game, id, () => score);
}

/** Returns the game with every score set to 0; the players stay. */
export function resetScores(game: GameState): GameState {
  return { ...game, players: game.players.map((player) => ({ ...player, score: 0 })) };
}
