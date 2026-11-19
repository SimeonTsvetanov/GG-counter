// The leaderboard order and totals (SPEC F4), used by the app's leaderboard and the share text.
import type { Player } from "./game.ts";

/** Players ordered for the leaderboard, with the total score and the leader. */
export interface Ranking {
  /** Highest score first; equal scores keep the order the players were added in. */
  readonly players: readonly Player[];
  /** Sum of all scores. */
  readonly totalScore: number;
  /** The first player of {@link Ranking.players}, or null when there are no players. */
  readonly leader: Player | null;
}

/** Returns the leaderboard for `players` without changing the input array. */
export function rank(players: readonly Player[]): Ranking {
  // Array.prototype.sort is stable (ES2019), which keeps ties in the order the players were added.
  const ordered = [...players].sort((a, b) => b.score - a.score);
  return {
    players: ordered,
    totalScore: players.reduce((sum, player) => sum + player.score, 0),
    leader: ordered[0] ?? null,
  };
}
