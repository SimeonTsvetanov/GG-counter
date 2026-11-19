// Reading the saved game exactly as the pre-forge app did (SPEC F7, AC7): example tests with the real
// shapes from tests/fixtures plus fast-check properties (never throws, output valid, idempotent).
import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { DIRTY_STATE, NULL_ENTRY_STATE, V0_STATE, V1_STATE } from "../../../tests/fixtures/saved-state.ts";
import { GAME_VERSION, parseSavedState, type GameState } from "../src/index.ts";

const NOW = "2026-11-19T10:00:00.000Z";

/** The game read from `raw`, or the error code. */
function read(raw: unknown): GameState | string {
  const result = parseSavedState(raw, NOW);
  return result.ok ? result.value : result.error.code;
}

/** Player names of the game read from `raw`. */
function namesOf(raw: unknown): readonly string[] | string {
  const game = read(raw);
  return typeof game === "string" ? game : game.players.map((p) => p.name);
}

describe("parseSavedState (examples)", () => {
  it("version 1 loads unchanged", () => {
    expect(read(V1_STATE)).toEqual(V1_STATE);
  });
  it("no version field (older builds): players and lastUpdated kept, version becomes 1", () => {
    expect(read(V0_STATE)).toEqual({ ...V0_STATE, version: GAME_VERSION });
  });
  it.each([0, 2, "1", null])("any other version (%j) is read the same way", (version) => {
    expect(read({ ...V1_STATE, version })).toEqual(V1_STATE);
  });
  it("entries with wrong field types are dropped; a numeric-string score is accepted", () => {
    expect(read(DIRTY_STATE)).toEqual({ players: [{ id: "x", name: "Valid", score: 12, createdAt: "2025-12-01T19:00:00.000Z" }], lastUpdated: NOW, version: 1 });
  });
  it.each([
    ["12", 12], ["-3", -3], [" 7 ", 7], ["", 0], [null, 0], [true, 1], [[5], 5], ["1e3", 1000],
  ])("score %j is read as %j (Number() coercion, as before)", (score, expected) => {
    const game = read({ players: [{ ...V1_STATE.players[0], score }] });
    expect(typeof game !== "string" && game.players[0]?.score).toBe(expected);
  });
  it.each([["abc"], [{}], [[1, 2]], [undefined]])("score %j drops the entry", (score) => {
    expect(namesOf({ players: [{ ...V1_STATE.players[0], score }] })).toEqual([]);
  });
  it("fields other than id, name, score and createdAt are not kept", () => {
    expect(read({ players: [{ ...V1_STATE.players[0], colour: "red" }], extra: 1 })).toEqual({ players: [V1_STATE.players[0]], lastUpdated: NOW, version: 1 });
  });
  it("names are kept as saved (no trimming, no length limit for saved games)", () => {
    const name = ` ${"x".repeat(60)} `;
    expect(namesOf({ players: [{ ...V1_STATE.players[0], name }] })).toEqual([name]);
  });
  it("players that is not an array → an empty game that keeps lastUpdated", () => {
    expect(read({ players: { a: 1 }, lastUpdated: "2025-01-01T00:00:00.000Z" })).toEqual({ players: [], lastUpdated: "2025-01-01T00:00:00.000Z", version: 1 });
  });
  it("a missing or non-string lastUpdated becomes `now`", () => {
    expect(read({ players: [], lastUpdated: 5 })).toEqual({ players: [], lastUpdated: NOW, version: 1 });
  });
  it.each([[null], [42], ["text"], [true], [[V1_STATE]], [undefined]])("SAVED_STATE_INVALID for %j", (raw) => {
    expect(read(raw)).toBe("SAVED_STATE_INVALID");
  });
  it("entries that are numbers, strings or arrays are dropped", () => {
    expect(namesOf({ players: [7, "Ana", [V1_STATE.players[0]], V1_STATE.players[1]] })).toEqual(["Boris"]);
  });
  it("regression (PLAN T-01 finding): a null entry is dropped and the valid players survive", () => {
    expect(read(NULL_ENTRY_STATE)).toEqual({ players: [V1_STATE.players[0]], lastUpdated: NOW, version: 1 });
    expect(namesOf({ players: [null, V1_STATE.players[1], null] })).toEqual(["Boris"]);
  });
  it("a value whose Number() conversion throws is dropped, not thrown", () => {
    const score = { valueOf: (): never => { throw new Error("boom"); } };
    expect(namesOf({ players: [{ ...V1_STATE.players[0], score }] })).toEqual([]);
  });
});

/** True when `game` has the saved-game shape the app relies on. */
function isValidGame(game: GameState): boolean {
  return game.version === GAME_VERSION && typeof game.lastUpdated === "string" && game.players.every((p) => typeof p.id === "string" && typeof p.name === "string" && typeof p.createdAt === "string" && Number.isFinite(p.score));
}

const playerLike = fc.record(
  { id: fc.oneof(fc.string(), fc.jsonValue()), name: fc.oneof(fc.string(), fc.jsonValue()), score: fc.oneof(fc.integer(), fc.string(), fc.jsonValue()), createdAt: fc.oneof(fc.string(), fc.jsonValue()) },
  { requiredKeys: [] },
);
const stateLike = fc.record(
  { players: fc.oneof(fc.array(fc.oneof(playerLike, fc.jsonValue())), fc.jsonValue()), lastUpdated: fc.oneof(fc.string(), fc.jsonValue()), version: fc.jsonValue() },
  { requiredKeys: [] },
);
const anySaved = fc.oneof(stateLike, fc.jsonValue());

describe("parseSavedState (properties)", () => {
  // On failure fast-check prints { seed, path }: replay with fc.assert(property, { seed, path, endOnFailure: true })
  // and copy the shrunk counterexample into an example test above (engineering → testing §3).
  it("never throws, for any JSON value or any value at all", () => {
    fc.assert(fc.property(anySaved, (raw) => { parseSavedState(raw, NOW); }));
    fc.assert(fc.property(fc.anything(), (raw) => { parseSavedState(raw, NOW); }));
  });
  it("a successful result is always a valid game", () => {
    fc.assert(fc.property(anySaved, (raw) => {
      const result = parseSavedState(raw, NOW);
      return !result.ok || isValidGame(result.value);
    }));
  });
  it("is idempotent: reading its own output gives the same game", () => {
    fc.assert(fc.property(anySaved, (raw) => {
      const result = parseSavedState(raw, NOW);
      if (!result.ok) return;
      expect(parseSavedState(result.value, "later")).toEqual(result);
    }));
  });
});
