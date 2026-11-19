// The share text must keep the pre-forge format exactly (SPEC §4, e2e AC5).
import { describe, expect, it } from "vitest";
import { formatLeaderboard, type Player } from "../src/index.ts";

/** A player with `name` (also used as id) and `score`. */
function player(name: string, score: number): Player {
  return { id: name, name, score, createdAt: "2025-12-01T19:00:00.000Z" };
}

describe("formatLeaderboard", () => {
  it("gives the known format for the AC5 game", () => {
    const text = formatLeaderboard({ players: [player("Ana", 34), player("Boris", 27), player("Чен", -3)], snapshot: "19/11/2026, 10:00:00" });
    expect(text).toBe([
      "🏆 GG Counter Leaderboard",
      "",
      "🥇 1st — Ana (34 pts)",
      "🥈 2nd — Boris (27 pts)",
      "🥉 3rd — Чен (-3 pts)",
      "",
      "🎯 Total score: 58",
      "👥 Players: 3",
      "🕒 Snapshot: 19/11/2026, 10:00:00",
    ].join("\n"));
  });
  it("ranks the players itself and uses 🎲 from the fourth place on", () => {
    const text = formatLeaderboard({ players: [player("D", 1), player("C", 2), player("B", 3), player("A", 4), player("E", 0)], snapshot: "now" });
    expect(text.split("\n").slice(2, 7)).toEqual(["🥇 1st — A (4 pts)", "🥈 2nd — B (3 pts)", "🥉 3rd — C (2 pts)", "🎲 4th — D (1 pts)", "🎲 5th — E (0 pts)"]);
  });
  it("no players → header and totals only", () => {
    expect(formatLeaderboard({ players: [], snapshot: "now" })).toBe("🏆 GG Counter Leaderboard\n\n\n🎯 Total score: 0\n👥 Players: 0\n🕒 Snapshot: now");
  });
});
