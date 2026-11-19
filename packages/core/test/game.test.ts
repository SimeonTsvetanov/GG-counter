// The empty game every new session starts from.
import { describe, expect, it } from "vitest";
import { GAME_VERSION, createEmptyGame } from "../src/index.ts";

describe("createEmptyGame", () => {
  it("has no players, the given time and version 1", () => {
    expect(createEmptyGame("2026-11-19T10:00:00.000Z")).toEqual({ players: [], lastUpdated: "2026-11-19T10:00:00.000Z", version: GAME_VERSION });
    expect(GAME_VERSION).toBe(1);
  });
});
