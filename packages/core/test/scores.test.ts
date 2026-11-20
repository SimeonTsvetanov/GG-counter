// Example tests for the score transitions (SPEC F3, F6; 1.1 F13–F16; limits SPEC §7).
import { describe, expect, it } from "vitest";
import { MAX_HISTORY_ENTRIES, MAX_SCORE, MIN_SCORE, adjustScore, removeScoreEntry, resetPlayerScore, resetScores, restoreScoreEntry, type GameState, type Result, type ScoreChange, type ScoreEntry } from "../src/index.ts";

const game: GameState = {
  players: [
    { id: "a1", name: "Ana", score: 34, createdAt: "2025-12-01T19:00:00.000Z", history: [{ id: "e1", delta: 34, at: "2025-12-01T20:00:00.000Z" }] },
    { id: "b2", name: "Boris", score: 27, createdAt: "2025-12-01T19:00:05.000Z", history: [] },
  ],
  lastUpdated: "2025-12-01T21:30:00.000Z",
  version: 2,
};

const AT = "2025-12-01T21:00:00.000Z";

/** A change of `delta` with entry id "n1" at {@link AT}. */
function change(delta: number, entryId = "n1", at = AT): ScoreChange {
  return { delta, entryId, at };
}

/** The player `id` after a successful transition. */
function playerAfter(result: Result<GameState, string>, id: string): GameState["players"][number] | undefined {
  return result.ok ? result.value.players.find((p) => p.id === id) : undefined;
}

describe("adjustScore", () => {
  it("+1, −1 and +12 give the exact sum (AC3)", () => {
    expect(playerAfter(adjustScore(game, "a1", change(1)), "a1")?.score).toBe(35);
    expect(playerAfter(adjustScore(game, "a1", change(-1)), "a1")?.score).toBe(33);
    expect(playerAfter(adjustScore(game, "a1", change(12)), "a1")?.score).toBe(46);
  });
  it("records the change as a history entry { id, delta, at } (F15)", () => {
    expect(playerAfter(adjustScore(game, "b2", change(5)), "b2")?.history).toEqual([{ id: "n1", delta: 5, at: AT }]);
  });
  it("changes only that player", () => {
    const result = adjustScore(game, "a1", change(5));
    expect(result.ok && result.value.players[1]).toEqual(game.players[1]);
  });
  it("accepts a fractional amount as the app always did", () => {
    expect(playerAfter(adjustScore(game, "a1", change(0.5)), "a1")?.score).toBe(34.5);
  });
  it("0 changes nothing and records nothing", () => {
    expect(adjustScore(game, "a1", change(0))).toEqual({ ok: true, value: game });
  });
  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])("SCORE_INVALID for %s", (delta) => {
    expect(adjustScore(game, "a1", change(delta))).toMatchObject({ ok: false, error: { code: "SCORE_INVALID" } });
  });
  it("reaches the limits exactly, SCORE_OUT_OF_RANGE one step beyond", () => {
    expect(playerAfter(adjustScore(game, "a1", change(MAX_SCORE - 34)), "a1")?.score).toBe(MAX_SCORE);
    expect(playerAfter(adjustScore(game, "a1", change(MIN_SCORE - 34)), "a1")?.score).toBe(MIN_SCORE);
    expect(adjustScore(game, "a1", change(MAX_SCORE - 33))).toMatchObject({ ok: false, error: { code: "SCORE_OUT_OF_RANGE" } });
    expect(adjustScore(game, "a1", change(MIN_SCORE - 35))).toMatchObject({ ok: false, error: { code: "SCORE_OUT_OF_RANGE" } });
  });
  it("a saved score beyond the limit may move back towards the range, not further away", () => {
    const legacy: GameState = { ...game, players: [{ ...game.players[0], score: 2_000_000 }] };
    expect(playerAfter(adjustScore(legacy, "a1", change(-1)), "a1")?.score).toBe(1_999_999);
    expect(adjustScore(legacy, "a1", change(1))).toMatchObject({ ok: false, error: { code: "SCORE_OUT_OF_RANGE" } });
  });
  it("PLAYER_NOT_FOUND for an unknown id", () => {
    expect(adjustScore(game, "nope", change(1))).toMatchObject({ ok: false, error: { code: "PLAYER_NOT_FOUND" } });
  });
});

describe("restoreScoreEntry (F16 Restore)", () => {
  const entries: ScoreEntry[] = [
    { id: "e1", delta: 4, at: "2025-12-01T21:00:00.000Z" },
    { id: "e2", delta: -2, at: "2025-12-01T21:05:00.000Z" },
    { id: "e3", delta: 12, at: "2025-12-01T21:10:00.000Z" },
  ];
  const three: GameState = { ...game, players: [{ ...game.players[0], score: 14, history: entries }] };
  it("puts the removed entry back in the same place with its points (remove → restore = the same game)", () => {
    for (const [index, entry] of entries.entries()) {
      const removed = removeScoreEntry(three, "a1", entry.id);
      const restored = removed.ok && restoreScoreEntry(removed.value, "a1", entry, index);
      expect(restored && restored.ok && restored.value).toEqual(three);
    }
  });
  it("clamps the position to the history (a stale index appends; a negative one puts it first)", () => {
    const extra: ScoreEntry = { id: "x", delta: 1, at: AT };
    expect(playerAfter(restoreScoreEntry(three, "a1", extra, 99), "a1")?.history.map((e) => e.id)).toEqual(["e1", "e2", "e3", "x"]);
    expect(playerAfter(restoreScoreEntry(three, "a1", extra, -3), "a1")?.history.map((e) => e.id)).toEqual(["x", "e1", "e2", "e3"]);
  });
  it("SCORE_ENTRY_EXISTS when the id is already there (a second Restore changes nothing)", () => {
    expect(restoreScoreEntry(three, "a1", entries[0] ?? { id: "", delta: 1, at: AT }, 0)).toMatchObject({ ok: false, error: { code: "SCORE_ENTRY_EXISTS" } });
  });
  it("SCORE_OUT_OF_RANGE by the same rule as a change; SCORE_INVALID for 0 or not a number; PLAYER_NOT_FOUND", () => {
    const top: GameState = { ...game, players: [{ ...game.players[0], score: MAX_SCORE, history: [] }] };
    expect(restoreScoreEntry(top, "a1", { id: "x", delta: 1, at: AT }, 0)).toMatchObject({ ok: false, error: { code: "SCORE_OUT_OF_RANGE" } });
    expect(restoreScoreEntry(game, "b2", { id: "x", delta: 0, at: AT }, 0)).toMatchObject({ ok: false, error: { code: "SCORE_INVALID" } });
    expect(restoreScoreEntry(game, "b2", { id: "x", delta: Number.NaN, at: AT }, 0)).toMatchObject({ ok: false, error: { code: "SCORE_INVALID" } });
    expect(restoreScoreEntry(game, "nope", { id: "x", delta: 1, at: AT }, 0)).toMatchObject({ ok: false, error: { code: "PLAYER_NOT_FOUND" } });
  });
  it(`a full history stays at ${String(MAX_HISTORY_ENTRIES)} entries: the oldest folds into the base`, () => {
    const full = Array.from({ length: MAX_HISTORY_ENTRIES }, (_, i): ScoreEntry => ({ id: `f${String(i)}`, delta: 1, at: AT }));
    const crowded: GameState = { ...game, players: [{ ...game.players[0], score: MAX_HISTORY_ENTRIES, history: full }] };
    const restored = playerAfter(restoreScoreEntry(crowded, "a1", { id: "x", delta: 5, at: AT }, MAX_HISTORY_ENTRIES), "a1");
    expect(restored?.score).toBe(MAX_HISTORY_ENTRIES + 5);
    expect(restored?.history).toHaveLength(MAX_HISTORY_ENTRIES);
    expect(restored?.history.at(0)?.id).toBe("f1");
  });
});

describe("removeScoreEntry (F16)", () => {
  it("takes the entry's delta off the score and removes it from the history", () => {
    const result = removeScoreEntry(game, "a1", "e1");
    expect(playerAfter(result, "a1")).toMatchObject({ score: 0, history: [] });
    expect(result.ok && result.value.players[1]).toBe(game.players[1]);
  });
  it("removing a −5 entry gives the 5 points back", () => {
    const scored = adjustScore(game, "b2", change(-5));
    expect(scored.ok && playerAfter(removeScoreEntry(scored.value, "b2", "n1"), "b2")).toMatchObject({ score: 27, history: [] });
  });
  it("SCORE_OUT_OF_RANGE when the score would leave the limits; the entry stays", () => {
    const top: GameState = { ...game, players: [{ ...game.players[0], score: MAX_SCORE, history: [{ id: "minus", delta: -5, at: AT }] }] };
    expect(removeScoreEntry(top, "a1", "minus")).toMatchObject({ ok: false, error: { code: "SCORE_OUT_OF_RANGE" } });
  });
  it("a legacy score beyond the limit may move back towards the range", () => {
    const legacy: GameState = { ...game, players: [{ ...game.players[0], score: 2_000_000, history: [{ id: "plus", delta: 3, at: AT }] }] };
    expect(playerAfter(removeScoreEntry(legacy, "a1", "plus"), "a1")?.score).toBe(1_999_997);
  });
  it("PLAYER_NOT_FOUND and SCORE_ENTRY_NOT_FOUND", () => {
    expect(removeScoreEntry(game, "nope", "e1")).toMatchObject({ ok: false, error: { code: "PLAYER_NOT_FOUND" } });
    expect(removeScoreEntry(game, "b2", "e1")).toMatchObject({ ok: false, error: { code: "SCORE_ENTRY_NOT_FOUND" } });
  });
});

describe("resetPlayerScore (F14)", () => {
  it("sets one player's score to 0 and empties their history; the player and the others stay", () => {
    const result = resetPlayerScore(game, "a1");
    expect(result.ok && result.value.players).toEqual([{ ...game.players[0], score: 0, history: [] }, game.players[1]]);
  });
  it("PLAYER_NOT_FOUND for an unknown id", () => {
    expect(resetPlayerScore(game, "nope")).toMatchObject({ ok: false, error: { code: "PLAYER_NOT_FOUND" } });
  });
});

describe("resetScores", () => {
  it("sets every score to 0, empties every history and keeps the players (AC6, F13)", () => {
    expect(resetScores(game).players).toEqual(game.players.map((p) => ({ ...p, score: 0, history: [] })));
  });
  it("leaves the input game untouched", () => {
    resetScores(game);
    expect(game.players[0]?.score).toBe(34);
  });
});
