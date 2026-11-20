// The ranked players as one list (leaderboard.css): the podium with 🥇🥈🥉 and their points, the rest
// numbered and quieter — shared by the leaderboard card and dialog. Medals and numbers are the shared places
// (ties share one, SPEC 1.1 F18), the same medals the player cards show.
import { useRef } from "react";
import { podiumPlaces, rank, type Player } from "gg-counter-core";
import { useFlip } from "../hooks/use-flip";
import { t } from "../i18n";
import { MEDALS } from "./medals";

/** Props of {@link PodiumList}. */
interface PodiumListProps {
  /** All players, ranked by score. */
  players: readonly Player[];
  /** How a row after the podium reads ("4. Boris" on the card, "🎲 4 — Boris" in the dialog). */
  restRow: "app.leaderboard.rankRow" | "app.leaderboard.rankRowDialog";
  /** Shown instead of the rows when there are no players. */
  empty: React.ReactNode;
}

/** Lists the ranked players, or `empty` when there is nobody. */
export function PodiumList({ players, restRow, empty }: PodiumListProps): React.JSX.Element {
  const listRef = useRef<HTMLDivElement>(null);
  // A player who passes another slides to the new place (SPEC 1.2 F20).
  useFlip(listRef, "rank");
  if (players.length === 0) return <>{empty}</>;
  const ranking = rank(players);
  const podium = podiumPlaces(ranking);
  return (
    <div ref={listRef} className="rank-list">
      {ranking.players.map((player, index) => {
        const medal = podium.get(player.id);
        return medal === undefined ? (
          <div key={player.id} className="rank-row rank-row--rest" data-flip={`rank:${player.id}`}>
            <span className="rank-name">{t(restRow, { rank: ranking.places.get(player.id) ?? index + 1, name: player.name })}</span>
            <span className="rank-points">{player.score}</span>
          </div>
        ) : (
          <div key={player.id} className="rank-row" data-flip={`rank:${player.id}`}>
            <span className="rank-name">{MEDALS[medal]} {player.name}</span>
            <span className="rank-points">{t("app.leaderboard.points", { count: player.score })}</span>
          </div>
        );
      })}
    </div>
  );
}
