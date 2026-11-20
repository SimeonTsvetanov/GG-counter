// The leaderboard order, places and totals (SPEC F4; places and medals for the rank badges, 1.1 F18) —
// the one ranking used by the app's leaderboard, the player cards and the share text.
import type { Player } from "./game.ts";

/** Players ordered for the leaderboard, with their places, the total score and the leader. */
export interface Ranking {
  /** Highest score first; equal scores keep the order the players were added in. */
  readonly players: readonly Player[];
  /**
   * Each player's place by id, with ties sharing a place ("1224" competition ranking: 34, 27, 27, 5
   * → 1, 2, 2, 4).
   */
  readonly places: ReadonlyMap<string, number>;
  /** Sum of all scores. */
  readonly totalScore: number;
  /** The first player of {@link Ranking.players}, or null when there are no players. */
  readonly leader: Player | null;
}

/** Returns the place of each player in `ordered` (highest score first); equal scores share a place. */
function placesOf(ordered: readonly Player[]): Map<string, number> {
  const places = new Map<string, number>();
  ordered.forEach((player, index) => {
    // because .at(-1) would wrap to the last player, the first one has no previous
    const previous = index === 0 ? undefined : ordered.at(index - 1);
    const place = previous?.score === player.score ? places.get(previous.id) : undefined;
    places.set(player.id, place ?? index + 1);
  });
  return places;
}

/** Returns the leaderboard for `players` without changing the input array. */
export function rank(players: readonly Player[]): Ranking {
  // Array.prototype.sort is stable (ES2019), which keeps ties in the order the players were added.
  const ordered = [...players].sort((a, b) => b.score - a.score);
  return {
    players: ordered,
    places: placesOf(ordered),
    totalScore: players.reduce((sum, player) => sum + player.score, 0),
    leader: ordered[0] ?? null,
  };
}

/** A place that earns a medal (🥇 🥈 🥉). */
export type PodiumPlace = 1 | 2 | 3;

/** True when `place` is 1, 2 or 3. */
function isPodiumPlace(place: number): place is PodiumPlace {
  return place >= 1 && place <= 3;
}

/**
 * Returns the medal place of each player who has one: places 1–3 of `ranking` (ties share a medal), but
 * only while at least two scores differ — when every score is equal (a new game at 0, a single player) a
 * medal would say nothing, so nobody gets one (SPEC 1.1 F18).
 */
export function podiumPlaces(ranking: Ranking): ReadonlyMap<string, PodiumPlace> {
  const medals = new Map<string, PodiumPlace>();
  const first = ranking.players.at(0);
  const last = ranking.players.at(-1);
  if (first === undefined || last === undefined || first.score === last.score) return medals;
  for (const [id, place] of ranking.places) {
    if (isPodiumPlace(place)) medals.set(id, place);
  }
  return medals;
}
