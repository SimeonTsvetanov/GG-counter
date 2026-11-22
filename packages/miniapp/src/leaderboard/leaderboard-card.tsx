// The Leaderboard card at the end of the main screen: leader, ranked players, Share, Reset scores
// and Clear session (both open the one Clear session alert, SPEC 1.1 F13). The header watches this card
// to switch its layout when it scrolls away.
import type { Ranking } from "gg-counter-core";
import { RefreshCw, Share2, Trophy } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { CARD_WIDTH_CLASS } from "../lib/layout";
import { t } from "../i18n";
import { PodiumList } from "./podium-list";

/** Props of {@link LeaderboardCard}. */
interface LeaderboardCardProps {
  /** Attached to the card's wrapper (the header observes it). */
  ref: React.Ref<HTMLDivElement>;
  ranking: Ranking;
  onShare: () => void;
  /** Opens the Clear session alert with "Scores only" checked. */
  onRequestReset: () => void;
  /** Opens the Clear session alert with "Players and scores" checked. */
  onRequestClear: () => void;
}

/** Shows the leader and the ranked players with the session actions. */
export function LeaderboardCard({
  ref,
  ranking,
  onShare,
  onRequestReset,
  onRequestClear,
}: LeaderboardCardProps): React.JSX.Element {
  const isEmpty = ranking.players.length === 0;

  return (
    <div ref={ref} className={CARD_WIDTH_CLASS} data-flip="main:leaderboard">
      <Card>
        <CardHeader>
          <CardTitle>
            <Trophy aria-hidden /> {t("app.leaderboard.title")}
          </CardTitle>
          {ranking.leader ? (
            <span className="leader-name">{ranking.leader.name}</span>
          ) : (
            <span className="card-meta">{t("app.leaderboard.noPlayers")}</span>
          )}
        </CardHeader>
        <CardContent>
          <PodiumList
            players={ranking.players}
            restRow="app.leaderboard.rankRow"
            empty={<CardDescription>{t("app.leaderboard.emptyCard")}</CardDescription>}
          />
        </CardContent>
        {/* Equal-width buttons (button-stack); the quiet red Clear session is never the loudest one. */}
        <CardFooter className="button-stack">
          <Button variant="secondary" onClick={onShare} disabled={isEmpty}>
            <Share2 aria-hidden /> {t("app.leaderboard.share")}
          </Button>
          <Button variant="secondary" onClick={onRequestReset} disabled={isEmpty}>
            <RefreshCw aria-hidden /> {t("app.leaderboard.reset")}
          </Button>
          <Button variant="destructive" onClick={onRequestClear}>{t("app.header.clear")}</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
