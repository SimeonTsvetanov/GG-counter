// Reads the saved game (`gg-counter/state`, `gg-counter:v1:state`, export files). parseSavedState reads
// storage leniently, as the pre-forge app did (SPEC F7, AC7), except that a null player entry no longer
// loses the whole game; checkSavedGame is the strict check of an import. The app parses the JSON, this
// module checks the value. Saved games beyond today's limits load unchanged.
import { GAME_VERSION, type GameState, type Player } from "./game.ts";
import { readHistory } from "./saved-history.ts";
import { isObject } from "./unchecked.ts";
import { fail, ok, type Result } from "./result.ts";

/** Why a saved value could not be read as a game. */
export type SavedStateErrorCode = "SAVED_STATE_INVALID";

/** Why {@link checkSavedGame} refused a game: not a game, a player that cannot be read, a damaged history. */
export type SavedGameErrorCode = SavedStateErrorCode | "SAVED_PLAYER_INVALID" | "SAVED_HISTORY_INVALID";

/** Returns `Number(value)` as the pre-forge loader did ("12" → 12, "" → 0), or NaN when conversion throws. */
function toScore(value: unknown): number {
  try {
    return Number(value);
  } catch {
    // because a non-JSON value (an object without a primitive form) cannot be converted: drop it.
    return Number.NaN;
  }
}

/** A saved player entry as read: the player (null when a field has the wrong type) and whether its history was intact. */
interface PlayerRead {
  readonly player: Player | null;
  readonly isHistoryIntact: boolean;
}

/** Reads the player saved in `entry`; a history from 1.1 is read with it (games before 1.1 have none). */
function readPlayer(entry: unknown): PlayerRead {
  if (!isObject(entry)) return { player: null, isHistoryIntact: true };
  const { id, name, createdAt } = entry;
  const score = toScore(entry.score);
  if (typeof id !== "string" || typeof name !== "string" || typeof createdAt !== "string" || !Number.isFinite(score)) {
    return { player: null, isHistoryIntact: true };
  }
  const { history, isIntact } = readHistory(entry.history);
  return { player: { id, name, score, createdAt, history }, isHistoryIntact: isIntact };
}

/** Returns the players saved in `raw.players` (not an array = none) as they were read. */
function readPlayers(players: unknown): readonly PlayerRead[] {
  const entries: readonly unknown[] = Array.isArray(players) ? players : [];
  return entries.map(readPlayer);
}

/**
 * Returns the game saved in `raw` (the parsed JSON), or SAVED_STATE_INVALID when it is not an object.
 *
 * @param raw - The value parsed from storage.
 * @param now - ISO 8601 time used when the saved `lastUpdated` is missing.
 * @remarks Like the pre-forge app: the `version` field is not checked (missing, 0, 1 or 2 load the same
 * way and come back as {@link GAME_VERSION}); entries that are not players (wrong field types, null) are
 * dropped, the others kept — the pre-forge loader lost the whole game on a null entry (fixed in PLAN T-04);
 * scores go through `Number()` so numeric strings load; extra fields are not kept. Games saved before 1.1
 * have no history: each score becomes the player's base. Damaged history entries are dropped (the score,
 * the total, is kept).
 */
export function parseSavedState(raw: unknown, now: string): Result<GameState, SavedStateErrorCode> {
  if (!isObject(raw)) return fail("SAVED_STATE_INVALID", "The saved game is not an object.");
  const players = readPlayers(raw.players).flatMap((read) => (read.player === null ? [] : [read.player]));
  const lastUpdated = typeof raw.lastUpdated === "string" ? raw.lastUpdated : now;
  return ok({ players, lastUpdated, version: GAME_VERSION });
}

/**
 * Returns the game in `raw` only when all of it can be read — the check of an import, which must never
 * apply part of a game (Settings → Import).
 *
 * @param now - ISO 8601 time used when `lastUpdated` is missing.
 * @returns The game as {@link parseSavedState} reads it, or why it was refused: SAVED_STATE_INVALID (not a
 * game: no object or no player list), SAVED_PLAYER_INVALID (a player cannot be read) or
 * SAVED_HISTORY_INVALID (a player's history is damaged), with the player's position in the message.
 */
export function checkSavedGame(raw: unknown, now: string): Result<GameState, SavedGameErrorCode> {
  if (!isObject(raw) || !Array.isArray(raw.players)) return fail("SAVED_STATE_INVALID", "The game has no player list.");
  const reads = readPlayers(raw.players);
  const unreadable = reads.findIndex((read) => read.player === null);
  if (unreadable !== -1) return fail("SAVED_PLAYER_INVALID", `Player ${String(unreadable + 1)} cannot be read.`);
  const damaged = reads.findIndex((read) => !read.isHistoryIntact);
  if (damaged !== -1) return fail("SAVED_HISTORY_INVALID", `The score history of player ${String(damaged + 1)} is damaged.`);
  return parseSavedState(raw, now);
}
