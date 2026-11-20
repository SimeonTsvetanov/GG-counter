// The empty game every new session starts from.
import { describe, expect, it } from "vitest";
import { GAME_VERSION, createEmptyGame } from "../src/index.ts";

describe("createEmptyGame", () => {
  it("has no players, the given time and the current version", () => {
    expect(createEmptyGame("2026-11-19T10:00:00.000Z")).toEqual({ players: [], lastUpdated: "2026-11-19T10:00:00.000Z", version: GAME_VERSION });
    // 2 since GG Counter 1.1 (score history, DECISIONS 2026-11-20); 1.0.0 saved version 1.
    expect(GAME_VERSION).toBe(2);
  });
});
