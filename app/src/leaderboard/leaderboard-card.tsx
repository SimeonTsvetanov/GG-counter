// The Leaderboard card at the end of the main screen: leader, ranked players, Share, Reset scores
// and Clear session. The header watches this card to switch its layout when it scrolls away.
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
import { ClearSessionDialog } from "../session/clear-session-dialog";
import { PodiumList } from "./podium-list";

/** Props of {@link LeaderboardCard}. */
interface LeaderboardCardProps {
  /** Attached to the card's wrapper (the header observes it). */
  ref: React.Ref<HTMLDivElement>;
  ranking: Ranking;
  onShare: () => void;
  /** Asks to reset all scores (opens the reset confirmation). */
  onRequestReset: () => void;
  /** Deletes all players and scores (after this card's own confirmation). */
  onClear: () => void;
}

/** Shows the leader and the ranked players with the session actions. */
export function LeaderboardCard({
  ref,
  ranking,
  onShare,
  onRequestReset,
  onClear,
}: LeaderboardCardProps): React.JSX.Element {
  const isEmpty = ranking.players.length === 0;

  return (
    <div ref={ref} className={CARD_WIDTH_CLASS}>
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
          <ClearSessionDialog description={t("app.session.clearFromCard")} onConfirm={onClear}>
            <Button variant="destructive">{t("app.header.clear")}</Button>
          </ClearSessionDialog>
        </CardFooter>
      </Card>
    </div>
  );
}
