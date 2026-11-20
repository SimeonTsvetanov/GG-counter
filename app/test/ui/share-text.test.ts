// The share text in the UI language (PLAN T-09): English stays byte for byte the public format of
// SPEC §4 (core's default labels); Bulgarian uses its own words, ordinals and plurals.
import fc from "fast-check";
import { afterEach, describe, expect, it } from "vitest";
import { formatLeaderboard, type Player } from "gg-counter-core";
import { applyLanguage } from "../../src/i18n/index.ts";
import { leaderboardLabels, snapshotTime } from "../../src/share/share-text.ts";

/** A player with `name` (also the id) and `score`. */
function player(name: string, score: number): Player {
  return { id: name, name, score, createdAt: "2026-11-19T10:00:00.000Z", history: [] };
}

afterEach(async () => { await applyLanguage("en"); });

describe("share text", () => {
  it("property: English labels give core's public format exactly, for any names and scores", () => {
    const players = fc.uniqueArray(fc.record({ name: fc.string({ maxLength: 40 }), score: fc.integer({ min: -999_999, max: 999_999 }) }), { maxLength: 60, selector: (p) => p.name })
      .map((list) => list.map((p) => player(p.name, p.score)));
    fc.assert(
      fc.property(players, fc.string(), (list, snapshot) => {
        expect(formatLeaderboard({ players: list, snapshot, labels: leaderboardLabels() })).toBe(formatLeaderboard({ players: list, snapshot }));
      }),
    );
  });

  it("Bulgarian: heading, ordinals, plurals and totals in Bulgarian, same emoji and lines", async () => {
    await applyLanguage("bg");
    const text = formatLeaderboard({ players: [player("Ана", 34), player("Борис", 1), player("Чен", -3)], snapshot: "19.11.2026 г., 10:00:00", labels: leaderboardLabels() });
    expect(text.split("\n")).toEqual([
      "🏆 Класиране в GG Counter",
      "",
      "🥇 1-во — Ана (34 точки)",
      "🥈 2-ро — Борис (1 точка)",
      "🥉 3-то — Чен (-3 точки)",
      "",
      "🎯 Общо точки: 32",
      "👥 Играчи: 3",
      "🕒 Към 19.11.2026 г., 10:00:00",
    ]);
  });

  it("the snapshot uses the browser's format in English and the UI language otherwise", async () => {
    const date = new Date(2026, 10, 19, 10, 0, 0);
    expect(snapshotTime(date)).toBe(date.toLocaleString());
    await applyLanguage("bg");
    expect(snapshotTime(date)).toBe(date.toLocaleString("bg"));
  });
});
