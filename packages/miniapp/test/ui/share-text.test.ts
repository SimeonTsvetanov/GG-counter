// The share text in the UI language (SPEC §4, 1.2 F21): the English dictionary gives core's English labels
// exactly; Bulgarian uses its own words and plurals; the attribution with the app link stays English.
import fc from "fast-check";
import { afterEach, describe, expect, it } from "vitest";
import { englishLeaderboardLabels, formatLeaderboard, type Player } from "gg-counter-core";
import { STANDALONE_URL } from "../../src/meta.ts";
import { parseAttribution, setAttribution } from "../../src/share/attribution.ts";
import { applyLanguage } from "../../src/i18n/index.ts";
import { leaderboardLabels, shareDate } from "../../src/share/share-text.ts";

/** A player with `name` (also the id) and `score`. */
function player(name: string, score: number): Player {
  return { id: name, name, score, createdAt: "2026-11-19T10:00:00.000Z", history: [] };
}

/** The 1.2 example game: a tie for 2nd and a negative score. */
const GAME = [player("Ana", 34), player("Boris", 27), player("Chen", 27), player("Dana", -3)];

afterEach(async () => { await applyLanguage("en"); });

describe("share text", () => {
  it("property: the English dictionary gives core's English labels exactly, for any names and scores", () => {
    const players = fc.uniqueArray(fc.record({ name: fc.string({ maxLength: 40 }), score: fc.integer({ min: -999_999, max: 999_999 }) }), { maxLength: 60, selector: (p) => p.name })
      .map((list) => list.map((p) => player(p.name, p.score)));
    fc.assert(
      fc.property(players, fc.string(), (list, date) => {
        expect(formatLeaderboard({ players: list, date, labels: leaderboardLabels() })).toBe(formatLeaderboard({ players: list, date, labels: englishLeaderboardLabels(STANDALONE_URL) }));
      }),
    );
  });

  it("English: the 1.2 example ends with the app link", () => {
    const text = formatLeaderboard({ players: GAME, date: "Nov 20, 2026, 9:45 PM", labels: leaderboardLabels() });
    expect(text.split("\n").slice(-4)).toEqual(["👑 Winner: Ana — 34 points", "👥 4 players · 85 points in total", "", `— Made with GG Counter · ${STANDALONE_URL}`]);
  });

  it("Bulgarian: words, plurals and lists in Bulgarian, the same emoji and rows, the attribution in English", async () => {
    await applyLanguage("bg");
    const text = formatLeaderboard({ players: GAME, date: "20.11.2026 г., 21:45 ч.", labels: leaderboardLabels() });
    expect(text.split("\n")).toEqual([
      "🏆 GG Counter — Класиране",
      "📅 20.11.2026 г., 21:45 ч.",
      "",
      "🥇 34 · Ana",
      "🥈 27 · Boris",
      "🥈 27 · Chen",
      "4️⃣ −3 · Dana",
      "",
      "👑 Победител: Ana — 34 точки",
      "👥 4 играчи · общо 85 точки",
      "",
      `— Made with GG Counter · ${STANDALONE_URL}`,
    ]);
    const tie = formatLeaderboard({ players: [player("Ана", 1), player("Боби", 1)], date: "-", labels: leaderboardLabels() }).split("\n");
    expect(tie[6]).toBe("🤝 Всички са равни — по 1 точка");
    const winners = formatLeaderboard({ players: [player("Ана", 5), player("Боби", 5), player("Чен", 5), player("Дан", 0)], date: "-", labels: leaderboardLabels() }).split("\n");
    expect(winners[8]).toBe("👑 Победители: Ана, Боби и Чен — по 5 точки");
    expect(winners[9]).toBe("👥 4 играчи · общо 15 точки");
  });

  it("the date uses the browser's format in English and the UI language otherwise", async () => {
    const date = new Date(2026, 10, 20, 21, 45, 0);
    const style = { dateStyle: "medium", timeStyle: "short" } as const;
    expect(shareDate(date)).toBe(date.toLocaleString(undefined, style));
    await applyLanguage("bg");
    expect(shareDate(date)).toBe(date.toLocaleString("bg", style));
  });
});

describe("attribution from the host", () => {
  afterEach(() => { setAttribution(null); });
  it("names the host in the title and the last line when the host sets both parameters", () => {
    setAttribution(parseAttribution(new URLSearchParams("attribution-name=Quizzard&attribution-url=https://simeontsvetanov.github.io/Quizzard/")));
    const labels = leaderboardLabels();
    expect(labels.title).toContain("Quizzard");
    expect(labels.attribution).toBe("— Made with Quizzard · https://simeontsvetanov.github.io/Quizzard/");
  });
  it.each([
    ["no parameters", ""],
    ["only a name", "attribution-name=Quizzard"],
    ["http address", "attribution-name=Quizzard&attribution-url=http://example.com/"],
    ["credentials", "attribution-name=Quizzard&attribution-url=https://a:b@example.com/"],
    ["script as a name", "attribution-name=<script>&attribution-url=https://example.com/"],
    ["no domain", "attribution-name=Quizzard&attribution-url=https://localhost/"],
  ])("keeps GG Counter for %s", (_, query) => {
    expect(parseAttribution(new URLSearchParams(query))).toBeNull();
    setAttribution(parseAttribution(new URLSearchParams(query)));
    expect(leaderboardLabels().attribution).toBe(`— Made with GG Counter · ${STANDALONE_URL}`);
  });
});
