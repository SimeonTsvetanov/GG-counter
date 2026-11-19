// The ranked players as one list (leaderboard.css): the top three with 🥇🥈🥉 and their points, the rest
// numbered and quieter — shared by the leaderboard card and dialog.
import type { Player } from "gg-counter-core";
import { t } from "../i18n";

const MEDALS = ["🥇", "🥈", "🥉"];

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
  if (players.length === 0) return <>{empty}</>;
  return (
    <div className="rank-list">
      {players.map((player, index) => {
        const medal = MEDALS.at(index);
        return medal === undefined ? (
          <div key={player.id} className="rank-row rank-row--rest">
            <span className="rank-name">{t(restRow, { rank: index + 1, name: player.name })}</span>
            <span className="rank-points">{player.score}</span>
          </div>
        ) : (
          <div key={player.id} className="rank-row">
            <span className="rank-name">{medal} {player.name}</span>
            <span className="rank-points">{t("app.leaderboard.points", { count: player.score })}</span>
          </div>
        );
      })}
    </div>
  );
}
