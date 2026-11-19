// The Leaderboard dialog opened from the header (both header layouts use this one component).
import type { Player } from "gg-counter-core";
import { RefreshCw, Share2 } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { PodiumList } from "./podium-list";

/** Props of {@link LeaderboardDialog}. */
interface LeaderboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** All players, ranked by score. */
  players: readonly Player[];
  onShare: () => void;
  /** Asks to reset all scores (opens the reset confirmation). */
  onRequestReset: () => void;
  /** The button that opens the dialog. */
  children: React.ReactNode;
}

/** Shows the ranked players (top three with medals, the rest numbered) with Share and Reset scores. */
export function LeaderboardDialog({
  open,
  onOpenChange,
  players,
  onShare,
  onRequestReset,
  children,
}: LeaderboardDialogProps): React.JSX.Element {
  const remaining = players.slice(3);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Leaderboard</DialogTitle>
          <DialogDescription>
            Highlights from the current session
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <PodiumList
            players={players.slice(0, 3)}
            empty={
              <p className="text-sm text-muted-foreground">
                No players yet. Add someone to get started.
              </p>
            }
          />
          {remaining.length > 0 && (
            <div className="space-y-1">
              {remaining.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-1.5 text-xs shadow-sm"
                >
                  <span className="flex items-center gap-2">
                    🎲 {index + 4} — {player.name}
                  </span>
                  <span className="text-muted-foreground">
                    {player.score}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            onClick={onShare}
            variant="secondary"
            className="w-full sm:w-auto"
          >
            <Share2 className="mr-2 h-4 w-4" /> Share
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={onRequestReset}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Reset scores
          </Button>
          <DialogClose asChild>
            <Button className="w-full sm:w-auto">OK</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
