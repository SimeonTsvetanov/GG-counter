// The leaderboard as share text (SPEC F5, §4). The English format is public — people paste it into
// chats — so it must not change (e2e AC5); other UI languages pass their own labels (PLAN T-09), the
// emoji and the line structure stay the same.
import type { Player } from "./game.ts";
import { ordinal } from "./ordinal.ts";
import { rank } from "./ranking.ts";

const MEDALS = ["🥇", "🥈", "🥉"];
const OTHER_PLACE = "🎲";

/** The words of the share text in one language; the emoji, line order and blank lines are fixed. */
export interface LeaderboardTextLabels {
  /** The heading after 🏆, e.g. "GG Counter Leaderboard". */
  readonly title: string;
  /** One player's line after the medal, e.g. "1st — Ana (34 pts)"; `place` is 1-based. */
  readonly line: (place: number, name: string, score: number) => string;
  /** The total line after 🎯, e.g. "Total score: 58". */
  readonly total: (totalScore: number) => string;
  /** The player count line after 👥, e.g. "Players: 3". */
  readonly players: (count: number) => string;
  /** The time line after 🕒, e.g. "Snapshot: 19/11/2026, 10:00:00". */
  readonly snapshot: (time: string) => string;
}

/** The pre-forge English share text, word for word (SPEC §4). */
export const ENGLISH_LEADERBOARD_LABELS: LeaderboardTextLabels = {
  title: "GG Counter Leaderboard",
  line: (place, name, score) => `${ordinal(place)} — ${name} (${String(score)} pts)`,
  total: (totalScore) => `Total score: ${String(totalScore)}`,
  players: (count) => `Players: ${String(count)}`,
  snapshot: (time) => `Snapshot: ${time}`,
};

/** What {@link formatLeaderboard} needs. */
export interface LeaderboardTextInput {
  /** The players in any order; they are ranked here. */
  readonly players: readonly Player[];
  /** The time shown on the "Snapshot" line, already formatted for the reader. */
  readonly snapshot: string;
  /** The words in the reader's language; English (the public format) when left out. */
  readonly labels?: LeaderboardTextLabels;
}

/** Returns the share text: header, one line per player by rank, total score, player count and snapshot time. */
export function formatLeaderboard({ players, snapshot, labels = ENGLISH_LEADERBOARD_LABELS }: LeaderboardTextInput): string {
  const ranking = rank(players);
  const lines = ranking.players.map((player, index) => `${MEDALS[index] ?? OTHER_PLACE} ${labels.line(index + 1, player.name, player.score)}`);
  return [
    `🏆 ${labels.title}`,
    "",
    ...lines,
    "",
    `🎯 ${labels.total(ranking.totalScore)}`,
    `👥 ${labels.players(players.length)}`,
    `🕒 ${labels.snapshot(snapshot)}`,
  ].join("\n");
}
