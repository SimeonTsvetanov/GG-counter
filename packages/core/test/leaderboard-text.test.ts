// The share text (SPEC §4, 1.2 F21): title, date, one aligned row per player with the shared places of
// podiumPlaces, the winner or tie line, players and total, the attribution with the app link.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  englishLeaderboardLabels,
  formatLeaderboard,
  formatScore,
  placeMark,
  podiumPlaces,
  rank,
  type LeaderboardTextLabels,
  type Player,
} from "../src/index.ts";

const URL = "https://simeontsvetanov.github.io/GG-counter/";
const LABELS = englishLeaderboardLabels(URL);
/** U+2007 FIGURE SPACE: as wide as a digit, so right-aligned scores line up in a chat's own font. */
const FIGURE = " ";

/** A player with `name` (also used as id) and `score`. */
function player(name: string, score: number): Player {
  return { id: name, name, score, createdAt: "2025-12-01T19:00:00.000Z", history: [] };
}

describe("formatLeaderboard", () => {
  it("gives the known text for 4 players with a tie and a negative score", () => {
    const players = [player("Ana", 34), player("Boris", 27), player("Chen", 27), player("Dana", -3)];
    expect(formatLeaderboard({ players, date: "Nov 20, 2026, 9:45 PM", labels: LABELS })).toBe([
      "🏆 GG Counter — Leaderboard",
      "📅 Nov 20, 2026, 9:45 PM",
      "",
      "🥇 34 · Ana",
      "🥈 27 · Boris",
      "🥈 27 · Chen",
      "4️⃣ −3 · Dana",
      "",
      "👑 Winner: Ana — 34 points",
      "👥 4 players · 85 points in total",
      "",
      `— Made with GG Counter · ${URL}`,
    ].join("\n"));
  });

  it("pads scores with figure spaces to the widest one and keeps the order of the ranking", () => {
    const text = formatLeaderboard({ players: [player("D", 5), player("C", 120), player("B", -40), player("A", 7)], date: "now", labels: LABELS });
    expect(text.split("\n").slice(3, 7)).toEqual(["🥇 120 · C", `🥈 ${FIGURE}${FIGURE}7 · A`, `🥉 ${FIGURE}${FIGURE}5 · D`, "4️⃣ −40 · B"]);
  });

  it("two leaders share 🥇 and the winner line; the next place is 3rd", () => {
    const lines = formatLeaderboard({ players: [player("Ana", 9), player("Boris", 9), player("Chen", 2)], date: "now", labels: LABELS }).split("\n");
    expect(lines.slice(3, 6)).toEqual(["🥇 9 · Ana", "🥇 9 · Boris", "🥉 2 · Chen"]);
    expect(lines[7]).toBe("👑 Winners: Ana and Boris — 9 points each");
  });

  it("all equal: no medals, everyone 1st, a tie line instead of a winner", () => {
    const lines = formatLeaderboard({ players: [player("Ana", 1), player("Boris", 1)], date: "now", labels: LABELS }).split("\n");
    expect(lines.slice(3, 5)).toEqual(["1️⃣ 1 · Ana", "1️⃣ 1 · Boris"]);
    expect(lines[6]).toBe("🤝 All tied — 1 point each");
  });

  it("one player wins alone; singular words", () => {
    const lines = formatLeaderboard({ players: [player("Ana", 1)], date: "now", labels: LABELS }).split("\n");
    expect(lines.slice(3)).toEqual(["1️⃣ 1 · Ana", "", "👑 Winner: Ana — 1 point", "👥 1 player · 1 point in total", "", `— Made with GG Counter · ${URL}`]);
  });

  it("no players → title, date, totals and attribution only", () => {
    expect(formatLeaderboard({ players: [], date: "now", labels: LABELS })).toBe(
      ["🏆 GG Counter — Leaderboard", "📅 now", "", "👥 0 players · 0 points in total", "", `— Made with GG Counter · ${URL}`].join("\n"),
    );
  });

  it("uses the labels of another language and keeps the emoji, rows and line order", () => {
    const labels: LeaderboardTextLabels = {
      title: "GG Counter — Класиране",
      winners: (names, score) => `Победител: ${names.join(" и ")} — ${formatScore(score)} т.`,
      tie: (score) => `Всички са равни — по ${formatScore(score)} т.`,
      summary: (count, total) => `${String(count)} играчи · общо ${formatScore(total)} т.`,
      attribution: `— Made with GG Counter · ${URL}`,
    };
    const text = formatLeaderboard({ players: [player("Ана", 3), player("Боби", 5)], date: "20.11.2026 г.", labels });
    expect(text.split("\n")).toEqual([
      "🏆 GG Counter — Класиране",
      "📅 20.11.2026 г.",
      "",
      "🥇 5 · Боби",
      "🥈 3 · Ана",
      "",
      "👑 Победител: Боби — 5 т.",
      "👥 2 играчи · общо 8 т.",
      "",
      `— Made with GG Counter · ${URL}`,
    ]);
  });

  it("property: one row per player, marks agree with podiumPlaces, the link ends the text once", () => {
    const players = fc.uniqueArray(fc.record({ name: fc.stringMatching(/^[A-Za-zА-я]{1,12}$/), score: fc.integer({ min: -999_999, max: 999_999 }) }), { minLength: 1, maxLength: 50, selector: (p) => p.name })
      .map((list) => list.map((p) => player(p.name, p.score)));
    fc.assert(
      fc.property(players, (list) => {
        const lines = formatLeaderboard({ players: list, date: "now", labels: LABELS }).split("\n");
        const ranking = rank(list);
        const podium = podiumPlaces(ranking);
        const rows = lines.slice(3, 3 + list.length);
        ranking.players.forEach((p, index) => {
          const place = ranking.places.get(p.id) ?? 0;
          expect(rows[index]?.startsWith(`${placeMark(place, podium.get(p.id) ?? null)} `)).toBe(true);
          expect(rows[index]?.endsWith(` · ${p.name}`)).toBe(true);
        });
        // Every row's score column has the same width (figure-space padding).
        // (Digits, U+2007 and U+2212 are one UTF-16 unit each, so .length counts characters here.)
        const widths = new Set(rows.map((row) => (row.split(" · ")[0]?.split(" ").slice(1).join(" ") ?? "").length));
        expect(widths.size).toBe(1);
        expect(lines.at(-1)).toBe(LABELS.attribution);
        expect(lines.join("\n").split(URL).length).toBe(2);
      }),
    );
  });
});

describe("placeMark", () => {
  it("medal for a podium place, keycap number otherwise", () => {
    expect([placeMark(1, 1), placeMark(2, 2), placeMark(3, 3)]).toEqual(["🥇", "🥈", "🥉"]);
    expect([placeMark(1, null), placeMark(4, null), placeMark(9, null), placeMark(10, null)]).toEqual(["1️⃣", "4️⃣", "9️⃣", "🔟"]);
    expect(placeMark(12, null)).toBe("1️⃣2️⃣");
  });
});

describe("formatScore", () => {
  it("plain digits with a true minus sign", () => {
    expect([formatScore(0), formatScore(34), formatScore(-3), formatScore(-999_999)]).toEqual(["0", "34", "−3", "−999999"]);
  });
});
