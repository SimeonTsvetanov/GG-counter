// The header's actions (Leaderboard, Add player, Share, Clear session, Theme, Menu). One component for
// both header layouts; they differ only in the button style and an optional leading button. The theme
// button is shown from the `sm` breakpoint up; on phones the theme is in Menu → Settings (app-shell §2,
// DECISIONS 2026-11-19), so the phone header keeps the same number of buttons as before.
import type { Player } from "gg-counter-core";
import { Plus, RefreshCw, Share2, Trophy } from "lucide-react";
import { ThemeToggle } from "../components/theme-toggle";
import { Button } from "../components/ui/button";
import { t } from "../i18n";
import { LeaderboardDialog } from "../leaderboard/leaderboard-dialog";
import { AppMenu, type AppMenuProps } from "../ui/app-menu";

/** What the session actions do; the main screen owns the state behind them. */
export interface SessionActions {
  /** Scrolls to the Add player card and focuses its name field. */
  onQuickAdd: () => void;
  onShare: () => void;
  /** Opens the "Reset all scores?" confirmation. */
  onRequestReset: () => void;
  /** Opens the "Clear session?" confirmation. */
  onRequestClear: () => void;
}

/** Props of {@link ActionBar}. */
export interface ActionBarProps {
  /** Button style: ghost next to the title, outline in the compact layout. */
  variant: "ghost" | "outline";
  /** Layout classes of the bar itself. */
  className: string;
  /** Extra classes for the Add player, Share and Clear session buttons. */
  buttonClassName?: string;
  /** State of the Leaderboard dialog, shared by both header layouts. */
  leaderboard: { open: boolean; onOpenChange: (open: boolean) => void; players: readonly Player[] };
  actions: SessionActions;
  /** The app menu at the end of the bar (its button takes the bar's style). */
  menu: Omit<AppMenuProps, "variant">;
  /** Optional button placed before the actions. */
  children?: React.ReactNode;
}

/** Renders the row of icon buttons for the current session. */
export function ActionBar({
  variant,
  className,
  buttonClassName,
  leaderboard,
  actions,
  menu,
  children,
}: ActionBarProps): React.JSX.Element {
  return (
    <div className={className}>
      {children}

      <LeaderboardDialog
        {...leaderboard}
        onShare={actions.onShare}
        onRequestReset={actions.onRequestReset}
      >
        <Button variant={variant} size="icon" aria-label={t("app.header.leaderboard")}>
          <Trophy className="h-4 w-4" />
        </Button>
      </LeaderboardDialog>

      <Button
        variant={variant}
        size="icon"
        onClick={actions.onQuickAdd}
        aria-label={t("app.header.addPlayer")}
        className={buttonClassName}
      >
        <Plus className="h-4 w-4" />
      </Button>

      <Button
        variant={variant}
        size="icon"
        onClick={actions.onShare}
        aria-label={t("app.header.share")}
        className={buttonClassName}
      >
        <Share2 className="h-4 w-4" />
      </Button>

      <Button
        variant={variant}
        size="icon"
        onClick={actions.onRequestClear}
        aria-label={t("app.header.clear")}
        className={buttonClassName}
      >
        <RefreshCw className="h-4 w-4" />
      </Button>

      <ThemeToggle className="hidden sm:inline-flex" />
      <AppMenu {...menu} variant={variant} />
    </div>
  );
}
