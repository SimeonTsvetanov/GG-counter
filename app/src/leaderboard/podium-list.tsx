// The top three of the leaderboard with 🥇🥈🥉 — shared by the leaderboard card and dialog.
import type { Player } from "gg-counter-core";
import { t } from "../i18n";

const MEDALS = ["🥇", "🥈", "🥉"];

/** Props of {@link PodiumList}. */
interface PodiumListProps {
  /** The ranked top three (or fewer). */
  players: readonly Player[];
  /** Shown instead of the rows when there are no players. */
  empty: React.ReactNode;
}

/** Lists the top three players with their medal and points, or `empty` when there is nobody. */
export function PodiumList({ players, empty }: PodiumListProps): React.JSX.Element {
  return (
    <div className="space-y-2">
      {players.length === 0
        ? empty
        : players.map((player, index) => (
            <div
              key={player.id}
              className="flex items-center justify-between rounded-md bg-card/80 px-3 py-2 shadow-sm"
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                {MEDALS[index]} {player.name}
              </span>
              <span className="text-sm text-muted-foreground">
                {t("app.leaderboard.points", { score: player.score })}
              </span>
            </div>
          ))}
    </div>
  );
}
