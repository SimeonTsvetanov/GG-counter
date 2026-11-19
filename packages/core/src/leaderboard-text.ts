// The leaderboard as share text (SPEC F5, §4). The format is public — people paste it into chats —
// so it must not change (e2e AC5).
import type { Player } from "./game.ts";
import { ordinal } from "./ordinal.ts";
import { rank } from "./ranking.ts";

const MEDALS = ["🥇", "🥈", "🥉"];
const OTHER_PLACE = "🎲";

/** What {@link formatLeaderboard} needs. */
export interface LeaderboardTextInput {
  /** The players in any order; they are ranked here. */
  readonly players: readonly Player[];
  /** The time shown on the "Snapshot" line, already formatted for the reader. */
  readonly snapshot: string;
}

/** Returns the share text: header, one line per player by rank, total score, player count and snapshot time. */
export function formatLeaderboard({ players, snapshot }: LeaderboardTextInput): string {
  const ranking = rank(players);
  const lines = ranking.players.map((player, index) => {
    const medal = MEDALS[index] ?? OTHER_PLACE;
    return `${medal} ${ordinal(index + 1)} — ${player.name} (${String(player.score)} pts)`;
  });
  return [
    "🏆 GG Counter Leaderboard",
    "",
    ...lines,
    "",
    `🎯 Total score: ${String(ranking.totalScore)}`,
    `👥 Players: ${String(players.length)}`,
    `🕒 Snapshot: ${snapshot}`,
  ].join("\n");
}
