// Reads the saved game (`gg-counter/state`) exactly as the pre-forge app did (SPEC F7, AC7): the
// app parses the JSON, this module checks the value. Saved games beyond today's limits load unchanged.
import { GAME_VERSION, type GameState, type Player } from "./game.ts";
import { fail, ok, type Result } from "./result.ts";

/** Why a saved value could not be read as a game. */
export type SavedStateErrorCode = "SAVED_STATE_INVALID";

/** The fields read from the saved game and from each player entry; their types are still unchecked. */
interface UncheckedFields {
  readonly players?: unknown;
  readonly lastUpdated?: unknown;
  readonly id?: unknown;
  readonly name?: unknown;
  readonly score?: unknown;
  readonly createdAt?: unknown;
}

/** True for a plain object (not null, not an array); its fields are still unchecked. */
function isObject(value: unknown): value is UncheckedFields {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Returns `Number(value)` as the pre-forge loader did ("12" → 12, "" → 0), or NaN when conversion throws. */
function toScore(value: unknown): number {
  try {
    return Number(value);
  } catch {
    // because a non-JSON value (an object without a primitive form) cannot be converted: drop it.
    return Number.NaN;
  }
}

/** Returns the player saved in `entry`, or null when a field has the wrong type. */
function toPlayer(entry: unknown): Player | null {
  if (!isObject(entry)) return null;
  const { id, name, createdAt } = entry;
  const score = toScore(entry.score);
  if (typeof id !== "string" || typeof name !== "string" || typeof createdAt !== "string" || !Number.isFinite(score)) {
    return null;
  }
  return { id, name, score, createdAt };
}

/**
 * Returns the game saved in `raw` (the parsed JSON), or SAVED_STATE_INVALID when it is not an object.
 *
 * @param raw - The value parsed from storage.
 * @param now - ISO 8601 time used when the saved `lastUpdated` is missing.
 * @remarks Like the pre-forge app: the `version` field is not checked (missing, 0 or 1 load the same
 * way and come back as version 1); players with a wrong field type are dropped, the others kept;
 * scores go through `Number()` so numeric strings load; extra fields are not kept.
 */
export function parseSavedState(raw: unknown, now: string): Result<GameState, SavedStateErrorCode> {
  if (!isObject(raw)) return fail("SAVED_STATE_INVALID", "The saved game is not an object.");
  const entries: readonly unknown[] = Array.isArray(raw.players) ? raw.players : [];
  // Pre-forge defect kept until PLAN T-04 (c): the old loader threw on a null entry and lost the whole game.
  if (entries.some((entry) => entry == null)) return fail("SAVED_STATE_INVALID", "The saved game has an empty player entry.");
  const players = entries.map(toPlayer).filter((player) => player !== null);
  const lastUpdated = typeof raw.lastUpdated === "string" ? raw.lastUpdated : now;
  return ok({ players, lastUpdated, version: GAME_VERSION });
}
