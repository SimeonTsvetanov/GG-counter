// Example tests for the score transitions (SPEC F3, F6; limits SPEC §7).
import { describe, expect, it } from "vitest";
import { MAX_SCORE, MIN_SCORE, adjustScore, resetScores, setScore, type GameState } from "../src/index.ts";

const game: GameState = {
  players: [
    { id: "a1", name: "Ana", score: 34, createdAt: "2025-12-01T19:00:00.000Z" },
    { id: "b2", name: "Boris", score: 27, createdAt: "2025-12-01T19:00:05.000Z" },
  ],
  lastUpdated: "2025-12-01T21:30:00.000Z",
  version: 1,
};

/** The score of player `id` after a successful transition. */
function scoreAfter(result: ReturnType<typeof adjustScore>, id: string): number | undefined {
  return result.ok ? result.value.players.find((p) => p.id === id)?.score : undefined;
}

describe("adjustScore", () => {
  it("+1, −1 and +12 give the exact sum (AC3)", () => {
    expect(scoreAfter(adjustScore(game, "a1", 1), "a1")).toBe(35);
    expect(scoreAfter(adjustScore(game, "a1", -1), "a1")).toBe(33);
    expect(scoreAfter(adjustScore(game, "a1", 12), "a1")).toBe(46);
  });
  it("changes only that player", () => {
    const result = adjustScore(game, "a1", 5);
    expect(result.ok && result.value.players[1]).toEqual(game.players[1]);
  });
  it("accepts a fractional amount as the app always did", () => {
    expect(scoreAfter(adjustScore(game, "a1", 0.5), "a1")).toBe(34.5);
  });
  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])("SCORE_INVALID for %s", (delta) => {
    expect(adjustScore(game, "a1", delta)).toMatchObject({ ok: false, error: { code: "SCORE_INVALID" } });
  });
  it("reaches the limits exactly, SCORE_OUT_OF_RANGE one step beyond", () => {
    expect(scoreAfter(adjustScore(game, "a1", MAX_SCORE - 34), "a1")).toBe(MAX_SCORE);
    expect(scoreAfter(adjustScore(game, "a1", MIN_SCORE - 34), "a1")).toBe(MIN_SCORE);
    expect(adjustScore(game, "a1", MAX_SCORE - 33)).toMatchObject({ ok: false, error: { code: "SCORE_OUT_OF_RANGE" } });
    expect(adjustScore(game, "a1", MIN_SCORE - 35)).toMatchObject({ ok: false, error: { code: "SCORE_OUT_OF_RANGE" } });
  });
  it("a saved score beyond the limit may move back towards the range, not further away", () => {
    const legacy: GameState = { ...game, players: [{ ...game.players[0], score: 2_000_000 }] };
    expect(scoreAfter(adjustScore(legacy, "a1", -1), "a1")).toBe(1_999_999);
    expect(adjustScore(legacy, "a1", 1)).toMatchObject({ ok: false, error: { code: "SCORE_OUT_OF_RANGE" } });
  });
  it("PLAYER_NOT_FOUND for an unknown id", () => {
    expect(adjustScore(game, "nope", 1)).toMatchObject({ ok: false, error: { code: "PLAYER_NOT_FOUND" } });
  });
});

describe("setScore", () => {
  it("sets the score of one player", () => {
    const result = setScore(game, "b2", -3);
    expect(result.ok && result.value.players.map((p) => p.score)).toEqual([34, -3]);
  });
  it("SCORE_INVALID for NaN, SCORE_OUT_OF_RANGE beyond the limits, PLAYER_NOT_FOUND for an unknown id", () => {
    expect(setScore(game, "a1", Number.NaN)).toMatchObject({ ok: false, error: { code: "SCORE_INVALID" } });
    expect(setScore(game, "a1", MAX_SCORE + 1)).toMatchObject({ ok: false, error: { code: "SCORE_OUT_OF_RANGE" } });
    expect(setScore(game, "a1", MIN_SCORE - 1)).toMatchObject({ ok: false, error: { code: "SCORE_OUT_OF_RANGE" } });
    expect(setScore(game, "nope", 1)).toMatchObject({ ok: false, error: { code: "PLAYER_NOT_FOUND" } });
  });
});

describe("resetScores", () => {
  it("sets every score to 0 and keeps the players (AC6)", () => {
    expect(resetScores(game).players).toEqual(game.players.map((p) => ({ ...p, score: 0 })));
  });
  it("leaves the input game untouched", () => {
    resetScores(game);
    expect(game.players[0]?.score).toBe(34);
  });
});
