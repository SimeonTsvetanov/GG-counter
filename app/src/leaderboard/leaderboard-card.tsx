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
  const remaining = ranking.players.slice(3);
  const isEmpty = ranking.players.length === 0;

  return (
    <div ref={ref} className={CARD_WIDTH_CLASS}>
      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Trophy className="h-4 w-4" /> Leaderboard
          </CardTitle>
          {ranking.leader ? (
            <span className="text-sm font-medium text-primary">
              {ranking.leader.name}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">
              No players yet
            </span>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <PodiumList
            players={ranking.players.slice(0, 3)}
            empty={
              <CardDescription>
                Add players to populate the leaderboard.
              </CardDescription>
            }
          />
          {remaining.length > 0 && (
            <div className="grid gap-1 text-xs text-muted-foreground">
              {remaining.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-1 shadow-sm"
                >
                  <span>
                    {index + 4}. {player.name}
                  </span>
                  <span>{player.score}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onShare}
            disabled={isEmpty}
            className="w-full sm:w-auto"
          >
            <Share2 className="mr-2 h-4 w-4" /> Share
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRequestReset}
            disabled={isEmpty}
            className="w-full sm:w-auto"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Reset scores
          </Button>
          <ClearSessionDialog
            description="This deletes all players and scores. You cannot undo this action."
            onConfirm={onClear}
          >
            <Button
              variant="destructive"
              size="sm"
              className="w-full sm:w-auto"
            >
              Clear session
            </Button>
          </ClearSessionDialog>
        </CardFooter>
      </Card>
    </div>
  );
}
