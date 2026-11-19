// Checks a player name typed by the user; shared by adding and renaming players.
import { MAX_NAME_LENGTH } from "./limits.ts";
import { fail, ok, type Result } from "./result.ts";

/** Why a typed player name was rejected. */
export type NameErrorCode = "NAME_EMPTY" | "NAME_TOO_LONG";

/** Returns the trimmed name, or an error when it is blank or longer than {@link MAX_NAME_LENGTH}. */
export function checkPlayerName(name: string): Result<string, NameErrorCode> {
  const trimmed = name.trim();
  if (trimmed.length === 0) return fail("NAME_EMPTY", "Enter a player name.");
  // Code points, not UTF-16 units: an emoji counts as one character.
  if (Array.from(trimmed).length > MAX_NAME_LENGTH) {
    return fail("NAME_TOO_LONG", `Use at most ${String(MAX_NAME_LENGTH)} characters.`);
  }
  return ok(trimmed);
}
