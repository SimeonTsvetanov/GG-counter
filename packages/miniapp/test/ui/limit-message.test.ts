// Unit tests for the limit messages of the game screen (src/players/limit-message.ts); moved unchanged
// from app/test/ui/texts.test.ts with the code (PLAN GG-02).
import { describe, expect, it } from "vitest";
import { limitCode, limitMessage } from "../../src/players/limit-message.ts";

describe("limitMessage", () => {
  it("keeps only the codes that have a message", () => {
    expect(["PLAYERS_TOO_MANY", "NAME_TOO_LONG", "SCORE_OUT_OF_RANGE", "NAME_EMPTY", "x"].map(limitCode)).toEqual(["PLAYERS_TOO_MANY", "NAME_TOO_LONG", "SCORE_OUT_OF_RANGE", null, null]);
  });

  it("explains the three limits with their numbers", () => {
    expect(limitMessage("PLAYERS_TOO_MANY")).toBe("A game can have up to 50 players. Remove a player to add another.");
    expect(limitMessage("NAME_TOO_LONG")).toMatch(/up to 40 characters/);
    expect(limitMessage("SCORE_OUT_OF_RANGE")).toMatch(/from -999,999 to 999,999/);
  });

  it("stays silent where the pre-forge app was silent (blank name, not a number, missing player)", () => {
    for (const code of ["NAME_EMPTY", "SCORE_INVALID", "PLAYER_NOT_FOUND"]) expect(limitMessage(code)).toBeNull();
  });
});
