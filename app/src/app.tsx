// The GG Counter main screen — the composition root: it owns the game state and the dialog state
// shared between the header, the player cards and the leaderboard card, and places the app shell
// (menu, shell dialogs, footer, toasts — app/src/ui, PLAN T-08) around them.
import { useRef, useState } from "react";
import { StatusBanner } from "./components/status-banner";
import { useGameState } from "./hooks/use-game-state";
import { useInView } from "./hooks/use-in-view";
import { usePageInfo } from "./hooks/use-page-info";
import { LeaderboardCard } from "./leaderboard/leaderboard-card";
import { CARD_WIDTH_CLASS, CONTAINER_CLASS } from "./lib/layout";
import { PlayersSection } from "./players/players-section";
import type { SessionActions } from "./session/action-bar";
import { AppHeader } from "./session/app-header";
import { ClearSessionDialog } from "./session/clear-session-dialog";
import { ResetScoresDialog } from "./session/reset-scores-dialog";
import { shareLeaderboard } from "./share/share-leaderboard";
import { useTheme } from "./providers/theme-provider";
import { t } from "./i18n";
import { AppFooter } from "./ui/app-footer";
import { CrashTestHook } from "./ui/error-boundary";
import { ShellDialogs } from "./ui/shell-dialogs";
import { useAppShell } from "./ui/use-app-shell";

/** Share of the leaderboard card that must be on screen for the full header layout. */
const LEADERBOARD_IN_VIEW_THRESHOLD = 0.15;

/** The whole GG Counter screen: players, scores, leaderboard, share, install banner, how it works and FAQ. */
export function App(): React.JSX.Element {
  const game = useGameState();
  const shell = useAppShell();
  const { setTheme } = useTheme();
  const [isLeaderboardDialogOpen, setIsLeaderboardDialogOpen] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);

  const addInputRef = useRef<HTMLInputElement>(null);
  const addCardRef = useRef<HTMLDivElement>(null);
  const leaderboardCardRef = useRef<HTMLDivElement>(null);
  const isLeaderboardInView = useInView(leaderboardCardRef, LEADERBOARD_IN_VIEW_THRESHOLD);
  const pageInfoSlotRef = useRef<HTMLDivElement>(null);
  usePageInfo(pageInfoSlotRef);

  const handleShare = () => {
    void shareLeaderboard(game.state.players, () => { setIsLeaderboardDialogOpen(false); });
  };

  const actions: SessionActions = {
    onQuickAdd: () => {
      addCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      addInputRef.current?.focus();
    },
    onShare: handleShare,
    onRequestReset: () => { setIsResetDialogOpen(true); },
    onRequestClear: () => { setIsClearDialogOpen(true); },
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="safe-area flex w-full min-h-dvh flex-col">
        <AppHeader
          isLeaderboardInView={isLeaderboardInView}
          leaderboard={{
            open: isLeaderboardDialogOpen,
            onOpenChange: setIsLeaderboardDialogOpen,
            players: game.ranking.players,
          }}
          actions={actions}
          menu={{ runItem: shell.runItem, isInstalled: shell.install.isInstalled, canInstall: shell.install.canInstall }}
        />

        <StatusBanner install={shell.install} />

        <main className="flex-1">
          <div className={`${CONTAINER_CLASS} flex flex-col gap-6 py-6`}>
            <PlayersSection
              players={game.state.players}
              leaderId={game.ranking.leader?.id ?? null}
              onAddPlayer={game.addPlayer}
              onRename={game.renamePlayer}
              onRemove={game.removePlayer}
              onAdjust={game.adjustScore}
              addCardRef={addCardRef}
              addInputRef={addInputRef}
            />
            <LeaderboardCard
              ref={leaderboardCardRef}
              ranking={game.ranking}
              onShare={handleShare}
              onRequestReset={actions.onRequestReset}
              onClear={game.resetGame}
            />
            {/* How it works + FAQ from index.html, below the tool (filled by usePageInfo). */}
            <div ref={pageInfoSlotRef} className={CARD_WIDTH_CLASS} />
          </div>
        </main>

        <AppFooter runItem={shell.runItem} />
      </div>

      <ResetScoresDialog
        open={isResetDialogOpen}
        onOpenChange={setIsResetDialogOpen}
        onConfirm={() => {
          game.resetScores();
          setIsResetDialogOpen(false);
        }}
      />
      <ClearSessionDialog
        open={isClearDialogOpen}
        onOpenChange={setIsClearDialogOpen}
        description={t("app.session.clearFromHeader")}
        onConfirm={() => {
          game.resetGame();
          setIsClearDialogOpen(false);
        }}
      />
      <ShellDialogs
        dialog={shell.dialog}
        openDialog={shell.openDialog}
        onClose={shell.closeDialog}
        onImported={(data) => {
          game.reloadFromStorage();
          setTheme(data.theme);
        }}
        onCleared={() => {
          game.reloadFromStorage();
          setTheme("system");
        }}
      />
      <CrashTestHook />
    </div>
  );
}
