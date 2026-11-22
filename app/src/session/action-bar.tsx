// The session's header buttons (Leaderboard, Add player, Clear session) — part of the game screen. They
// render through a portal into the host's header slot (`Host.headerActions`, host.ts), so the host owns
// the header and the screen only fills its slot; the standalone header places the slot between its
// logo button and its Theme and Menu buttons (app-header.tsx), the same order as before the seam.
import type { Player } from "gg-counter-core";
import { Plus, RefreshCw, Trophy } from "lucide-react";
import { createPortal } from "react-dom";
import { Button } from "../components/ui/button";
import { t } from "../i18n";
import { LeaderboardDialog } from "../leaderboard/leaderboard-dialog";
import { useHost } from "../providers/host-provider";

/** What the session actions do; the main screen owns the state behind them. */
export interface SessionActions {
  /** Scrolls to the Add player card and focuses its name field. */
  onQuickAdd: () => void;
  onShare: () => void;
  /** Opens the "Clear session?" alert with "Scores only" checked (Reset scores buttons). */
  onRequestReset: () => void;
  /** Opens the "Clear session?" alert with "Players and scores" checked. */
  onRequestClear: () => void;
}

/** Props of {@link ActionBar}. */
export interface ActionBarProps {
  /** Button style: plain next to the title, on the fill colour in the compact header layout. */
  variant: "ghost" | "outline";
  /** State of the Leaderboard dialog. */
  leaderboard: { open: boolean; onOpenChange: (open: boolean) => void; players: readonly Player[] };
  actions: SessionActions;
}

/** Renders the session's icon buttons into the host's header slot. */
export function ActionBar({ variant, leaderboard, actions }: ActionBarProps): React.ReactPortal {
  const { headerActions } = useHost();
  return createPortal(
    <>
      <LeaderboardDialog
        {...leaderboard}
        onShare={actions.onShare}
        onRequestReset={actions.onRequestReset}
      >
        <Button variant={variant} size="icon" aria-label={t("app.header.leaderboard")}>
          <Trophy aria-hidden />
        </Button>
      </LeaderboardDialog>

      <Button
        variant={variant}
        size="icon"
        onClick={actions.onQuickAdd}
        aria-label={t("app.header.addPlayer")}
      >
        <Plus aria-hidden />
      </Button>

      <Button
        variant={variant}
        size="icon"
        onClick={actions.onRequestClear}
        aria-label={t("app.header.clear")}
        data-action="clear-session"
      >
        <RefreshCw aria-hidden />
      </Button>
    </>,
    headerActions,
  );
}
