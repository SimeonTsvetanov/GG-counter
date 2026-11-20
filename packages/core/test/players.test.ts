// Example tests for the player transitions (SPEC F1, F2; limits SPEC §7).
import { describe, expect, it } from "vitest";
import { MAX_NAME_LENGTH, MAX_PLAYERS, addPlayer, createEmptyGame, removePlayer, renamePlayer, type GameState } from "../src/index.ts";

const NOW = "2026-11-19T10:00:00.000Z";
const game: GameState = {
  players: [
    { id: "a1", name: "Ana", score: 34, createdAt: "2025-12-01T19:00:00.000Z", history: [] },
    { id: "b2", name: "Boris", score: 27, createdAt: "2025-12-01T19:00:05.000Z", history: [] },
  ],
  lastUpdated: "2025-12-01T21:30:00.000Z",
  version: 1,
};

/** A game with `count` players named P1…Pn. */
function gameWith(count: number): GameState {
  const players = Array.from({ length: count }, (_, i) => ({ id: `p${String(i)}`, name: `P${String(i + 1)}`, score: 0, createdAt: NOW, history: [] }));
  return { ...createEmptyGame(NOW), players };
}

describe("addPlayer", () => {
  it("appends a trimmed name with score 0, the given id and creation time", () => {
    const result = addPlayer(game, { name: "  Чен  ", id: "c3", createdAt: NOW });
    expect(result).toEqual({ ok: true, value: { ...game, players: [...game.players, { id: "c3", name: "Чен", score: 0, createdAt: NOW, history: [] }] } });
  });
  it("leaves the input game untouched", () => {
    const before = structuredClone(game);
    addPlayer(game, { name: "Vesko", id: "v", createdAt: NOW });
    expect(game).toEqual(before);
  });
  it.each(["", "   ", "\t\n"])("NAME_EMPTY for %j", (name) => {
    expect(addPlayer(game, { name, id: "x", createdAt: NOW })).toMatchObject({ ok: false, error: { code: "NAME_EMPTY" } });
  });
  it(`accepts exactly ${String(MAX_NAME_LENGTH)} characters, rejects one more with NAME_TOO_LONG`, () => {
    expect(addPlayer(game, { name: "x".repeat(MAX_NAME_LENGTH), id: "x", createdAt: NOW }).ok).toBe(true);
    expect(addPlayer(game, { name: "x".repeat(MAX_NAME_LENGTH + 1), id: "x", createdAt: NOW })).toMatchObject({ ok: false, error: { code: "NAME_TOO_LONG" } });
  });
  it("counts characters, not UTF-16 units (40 emoji fit)", () => {
    expect(addPlayer(game, { name: "🎲".repeat(MAX_NAME_LENGTH), id: "x", createdAt: NOW }).ok).toBe(true);
  });
  it("spaces around the name do not count towards the limit", () => {
    expect(addPlayer(game, { name: ` ${"x".repeat(MAX_NAME_LENGTH)} `, id: "x", createdAt: NOW }).ok).toBe(true);
  });
  it(`PLAYERS_TOO_MANY when the game already has ${String(MAX_PLAYERS)} players`, () => {
    expect(addPlayer(gameWith(MAX_PLAYERS - 1), { name: "Last", id: "x", createdAt: NOW }).ok).toBe(true);
    expect(addPlayer(gameWith(MAX_PLAYERS), { name: "One more", id: "x", createdAt: NOW })).toMatchObject({ ok: false, error: { code: "PLAYERS_TOO_MANY" } });
  });
});

describe("removePlayer", () => {
  it("removes the player with that id and keeps the order of the others", () => {
    expect(removePlayer(game, "a1").players.map((p) => p.name)).toEqual(["Boris"]);
  });
  it("an unknown id changes nothing", () => {
    expect(removePlayer(game, "nope")).toEqual(game);
  });
});

describe("renamePlayer", () => {
  it("renames with the trimmed name and keeps score, id and creation time", () => {
    const result = renamePlayer(game, "b2", "  Bobby ");
    expect(result).toEqual({ ok: true, value: { ...game, players: [game.players[0], { ...game.players[1], name: "Bobby" }] } });
  });
  it("NAME_EMPTY for a blank name", () => {
    expect(renamePlayer(game, "a1", "  ")).toMatchObject({ ok: false, error: { code: "NAME_EMPTY" } });
  });
  it("NAME_TOO_LONG above the limit", () => {
    expect(renamePlayer(game, "a1", "x".repeat(MAX_NAME_LENGTH + 1))).toMatchObject({ ok: false, error: { code: "NAME_TOO_LONG" } });
  });
  it("PLAYER_NOT_FOUND for an unknown id", () => {
    expect(renamePlayer(game, "nope", "Ana")).toMatchObject({ ok: false, error: { code: "PLAYER_NOT_FOUND" } });
  });
  it("a saved name longer than the limit can still be shortened", () => {
    const legacy: GameState = { ...game, players: [{ ...game.players[0], name: "y".repeat(60) }] };
    expect(renamePlayer(legacy, "a1", "Ana").ok).toBe(true);
  });
});
