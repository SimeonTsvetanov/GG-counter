// The Leaderboard dialog opened from the header (both header layouts use this one component).
import type { Player } from "gg-counter-core";
import { RefreshCw, Share2 } from "lucide-react";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { PodiumList } from "./podium-list";
import { t } from "../i18n";

/** Props of {@link LeaderboardDialog}. */
interface LeaderboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** All players, ranked by score. */
  players: readonly Player[];
  onShare: () => void;
  /** Opens the Clear session alert with "Scores only" checked. */
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("app.leaderboard.title")}</DialogTitle>
          <DialogDescription>{t("app.leaderboard.highlights")}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <PodiumList
            players={players}
            restRow="app.leaderboard.rankRowDialog"
            empty={<p className="text-text-secondary">{t("app.leaderboard.emptyDialog")}</p>}
          />
        </DialogBody>
        <DialogFooter>
          <Button onClick={onShare} variant="secondary">
            <Share2 aria-hidden /> {t("app.leaderboard.share")}
          </Button>
          <Button variant="secondary" onClick={onRequestReset}>
            <RefreshCw aria-hidden /> {t("app.leaderboard.reset")}
          </Button>
          <DialogClose asChild>
            <Button>{t("app.leaderboard.ok")}</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
