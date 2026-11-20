// Reading the saved game exactly as the pre-forge app did (SPEC F7, AC7): example tests with the real
// shapes from ./fixtures (shared with tests/e2e) plus fast-check properties (never throws, output valid, idempotent).
import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { DIRTY_STATE, NULL_ENTRY_STATE, V0_STATE, V1_STATE, V1_STATE_READ, V2_STATE } from "./fixtures/saved-state.ts";
import { GAME_VERSION, MAX_HISTORY_ENTRIES, checkSavedGame, parseSavedState, type GameState } from "../src/index.ts";

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
  it("version 1 (GG Counter 1.0.0) loads with the same players and scores and empty histories (1.1 upgrade)", () => {
    expect(read(V1_STATE)).toEqual(V1_STATE_READ);
  });
  it("version 2 (1.1) loads unchanged, histories included", () => {
    expect(read(V2_STATE)).toEqual(V2_STATE);
  });
  it("no version field (older builds): players and lastUpdated kept, version becomes 1", () => {
    expect(read(V0_STATE)).toEqual({ ...V0_STATE, players: V1_STATE_READ.players.slice(0, 2), version: GAME_VERSION });
  });
  it.each([0, 3, "1", null])("any other version (%j) is read the same way", (version) => {
    expect(read({ ...V1_STATE, version })).toEqual(V1_STATE_READ);
  });
  it("entries with wrong field types are dropped; a numeric-string score is accepted", () => {
    expect(read(DIRTY_STATE)).toEqual({ players: [{ id: "x", name: "Valid", score: 12, createdAt: "2025-12-01T19:00:00.000Z", history: [] }], lastUpdated: NOW, version: GAME_VERSION });
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
  it("fields other than id, name, score, createdAt and history are not kept", () => {
    expect(read({ players: [{ ...V1_STATE.players[0], colour: "red" }], extra: 1 })).toEqual({ players: [V1_STATE_READ.players[0]], lastUpdated: NOW, version: GAME_VERSION });
  });
  it("names are kept as saved (no trimming, no length limit for saved games)", () => {
    const name = ` ${"x".repeat(60)} `;
    expect(namesOf({ players: [{ ...V1_STATE.players[0], name }] })).toEqual([name]);
  });
  it("players that is not an array → an empty game that keeps lastUpdated", () => {
    expect(read({ players: { a: 1 }, lastUpdated: "2025-01-01T00:00:00.000Z" })).toEqual({ players: [], lastUpdated: "2025-01-01T00:00:00.000Z", version: GAME_VERSION });
  });
  it("a missing or non-string lastUpdated becomes `now`", () => {
    expect(read({ players: [], lastUpdated: 5 })).toEqual({ players: [], lastUpdated: NOW, version: GAME_VERSION });
  });
  it.each([[null], [42], ["text"], [true], [[V1_STATE]], [undefined]])("SAVED_STATE_INVALID for %j", (raw) => {
    expect(read(raw)).toBe("SAVED_STATE_INVALID");
  });
  it("entries that are numbers, strings or arrays are dropped", () => {
    expect(namesOf({ players: [7, "Ana", [V1_STATE.players[0]], V1_STATE.players[1]] })).toEqual(["Boris"]);
  });
  it("regression (PLAN T-01 finding): a null entry is dropped and the valid players survive", () => {
    expect(read(NULL_ENTRY_STATE)).toEqual({ players: [V1_STATE_READ.players[0]], lastUpdated: NOW, version: GAME_VERSION });
    expect(namesOf({ players: [null, V1_STATE.players[1], null] })).toEqual(["Boris"]);
  });
  it("a value whose Number() conversion throws is dropped, not thrown", () => {
    const score = { valueOf: (): never => { throw new Error("boom"); } };
    expect(namesOf({ players: [{ ...V1_STATE.players[0], score }] })).toEqual([]);
  });
});

/** True when `game` has the saved-game shape the app relies on. */
function isValidGame(game: GameState): boolean {
  return game.version === GAME_VERSION && typeof game.lastUpdated === "string" && game.players.every((p) => typeof p.id === "string" && typeof p.name === "string" && typeof p.createdAt === "string" && Number.isFinite(p.score) && isValidHistory(p.history));
}

/** True when `history` holds valid, uniquely identified entries within the cap. */
function isValidHistory(history: GameState["players"][number]["history"]): boolean {
  const ids = new Set(history.map((e) => e.id));
  return history.length <= MAX_HISTORY_ENTRIES && ids.size === history.length && history.every((e) => e.id !== "" && Number.isFinite(e.delta) && e.delta !== 0 && !Number.isNaN(Date.parse(e.at)));
}

const entryLike = fc.record(
  { id: fc.oneof(fc.string({ maxLength: 2 }), fc.jsonValue()), delta: fc.oneof(fc.integer({ min: -3, max: 3 }), fc.double(), fc.jsonValue()), at: fc.oneof(fc.date({ noInvalidDate: true }).map((d) => d.toISOString()), fc.string(), fc.jsonValue()) },
  { requiredKeys: [] },
);
const historyLike = fc.oneof(fc.array(fc.oneof(entryLike, fc.jsonValue()), { maxLength: 60 }), fc.jsonValue());
const playerLike = fc.record(
  { id: fc.oneof(fc.string(), fc.jsonValue()), name: fc.oneof(fc.string(), fc.jsonValue()), score: fc.oneof(fc.integer(), fc.string(), fc.jsonValue()), createdAt: fc.oneof(fc.string(), fc.jsonValue()), history: historyLike },
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

const ANA = V1_STATE.players[0];
const ENTRY = { id: "e1", delta: 2, at: "2025-12-01T21:00:00.000Z" };

describe("saved score history (SPEC 1.1 F15)", () => {
  it.each([
    ["not a list", "x"],
    ["null", null],
    ["an entry without id", [{ delta: 1, at: ENTRY.at }]],
    ["an empty id", [{ ...ENTRY, id: "" }]],
    ["a delta of 0", [{ ...ENTRY, delta: 0 }]],
    ["a string delta", [{ ...ENTRY, delta: "2" }]],
    ["a time that is not a date", [{ ...ENTRY, at: "yesterday" }]],
    ["a repeated id", [ENTRY, { ...ENTRY, delta: 5 }]],
  ])("storage: %s → the damaged entries are dropped, the score (the total) is kept", (_, history) => {
    const game = read({ players: [{ ...ANA, history }] });
    expect(typeof game !== "string" && game.players[0]).toMatchObject({ score: 34 });
    expect(typeof game !== "string" && game.players[0]?.history.every((e) => e.delta !== 0 && e.id !== "")).toBe(true);
  });
  it("storage: a valid entry next to a damaged one is kept", () => {
    const game = read({ players: [{ ...ANA, history: [7, ENTRY] }] });
    expect(typeof game !== "string" && game.players[0]?.history).toEqual([ENTRY]);
  });
  it(`more than ${String(MAX_HISTORY_ENTRIES)} entries keep the newest (folded into the base, not damage)`, () => {
    const history = Array.from({ length: MAX_HISTORY_ENTRIES + 3 }, (_, i) => ({ ...ENTRY, id: `e${String(i)}` }));
    const checked = checkSavedGame({ players: [{ ...ANA, history }] }, NOW);
    expect(checked.ok && checked.value.players[0]?.history.map((e) => e.id)).toEqual(history.slice(3).map((e) => e.id));
  });
});

describe("checkSavedGame (strict: imports)", () => {
  it("accepts a 1.0.0 game (no history) and a 1.1 game, read as parseSavedState reads them", () => {
    expect(checkSavedGame(V1_STATE, NOW)).toEqual({ ok: true, value: V1_STATE_READ });
    expect(checkSavedGame(V2_STATE, NOW)).toEqual({ ok: true, value: V2_STATE });
  });
  it("SAVED_STATE_INVALID without an object or a player list", () => {
    expect(checkSavedGame([], NOW)).toMatchObject({ ok: false, error: { code: "SAVED_STATE_INVALID" } });
    expect(checkSavedGame({ lastUpdated: NOW }, NOW)).toMatchObject({ ok: false, error: { code: "SAVED_STATE_INVALID" } });
  });
  it("SAVED_PLAYER_INVALID names the player that cannot be read", () => {
    expect(checkSavedGame(NULL_ENTRY_STATE, NOW)).toEqual({ ok: false, error: { code: "SAVED_PLAYER_INVALID", message: "Player 2 cannot be read." } });
  });
  it.each([["not a list", "x"], ["a delta of 0", [{ ...ENTRY, delta: 0 }]], ["a repeated id", [ENTRY, ENTRY]], ["a bad time", [{ ...ENTRY, at: 5 }]]])(
    "SAVED_HISTORY_INVALID for %s, with the player's position",
    (_, history) => {
      const raw = { players: [V2_STATE.players[0], { ...V1_STATE.players[1], history }] };
      expect(checkSavedGame(raw, NOW)).toEqual({ ok: false, error: { code: "SAVED_HISTORY_INVALID", message: "The score history of player 2 is damaged." } });
    },
  );
});

describe("checkSavedGame (properties)", () => {
  it("never throws; accepts only what parseSavedState reads completely (same players, same game)", () => {
    fc.assert(fc.property(anySaved, (raw) => {
      const checked = checkSavedGame(raw, NOW);
      if (!checked.ok) return;
      // because an accepted value is an object with a player list (SAVED_STATE_INVALID otherwise)
      const players = (raw as { players: unknown[] }).players;
      expect(checked.value.players).toHaveLength(players.length);
      expect(checked).toEqual(parseSavedState(raw, NOW));
    }));
  });
});
