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
import { ClearSessionDialog, type ClearScope } from "./session/clear-session-dialog";
import { shareLeaderboard } from "./share/share-leaderboard";
import { useTheme } from "./providers/theme-provider";
import { applyLanguage } from "./i18n";
import { useLanguage } from "./i18n/use-language";
import { AppFooter } from "./ui/app-footer";
import { CrashTestHook } from "./ui/error-boundary";
import { ShellDialogs } from "./ui/shell-dialogs";
import { useAppShell } from "./ui/use-app-shell";

/** Share of the leaderboard card that must be on screen for the full header layout. */
const LEADERBOARD_IN_VIEW_THRESHOLD = 0.15;
/** Any part of the 1 px top marker on screen = the page is at the top (no header shadow). */
const AT_TOP_THRESHOLD = 0;

/** The whole GG Counter screen: players, scores, leaderboard, share, install banner, how it works and FAQ. */
export function App(): React.JSX.Element {
  // Re-renders the whole screen (every t() call in it) when the language changes in Settings.
  const lang = useLanguage();
  const game = useGameState();
  const shell = useAppShell();
  const { setTheme } = useTheme();
  const [isLeaderboardDialogOpen, setIsLeaderboardDialogOpen] = useState(false);
  // The one Clear session alert: which option it opens with, or null while it is closed.
  const [clearRequest, setClearRequest] = useState<ClearScope | null>(null);

  const addInputRef = useRef<HTMLInputElement>(null);
  const addCardRef = useRef<HTMLDivElement>(null);
  const leaderboardCardRef = useRef<HTMLDivElement>(null);
  const isLeaderboardInView = useInView(leaderboardCardRef, LEADERBOARD_IN_VIEW_THRESHOLD);
  const topSentinelRef = useRef<HTMLSpanElement>(null);
  const isAtTop = useInView(topSentinelRef, AT_TOP_THRESHOLD);
  const pageInfoSlotRef = useRef<HTMLDivElement>(null);
  usePageInfo(pageInfoSlotRef, lang);

  const handleShare = () => {
    void shareLeaderboard(game.state.players, () => { setIsLeaderboardDialogOpen(false); });
  };

  const actions: SessionActions = {
    onQuickAdd: () => {
      addCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      addInputRef.current?.focus();
    },
    onShare: handleShare,
    onRequestReset: () => { setClearRequest("scores"); },
    onRequestClear: () => { setClearRequest("all"); },
  };

  return (
    <>
      <div className="app">
        <span ref={topSentinelRef} className="scroll-sentinel" aria-hidden />
        <AppHeader
          isLeaderboardInView={isLeaderboardInView}
          isScrolled={!isAtTop}
          leaderboard={{
            open: isLeaderboardDialogOpen,
            onOpenChange: setIsLeaderboardDialogOpen,
            players: game.ranking.players,
          }}
          actions={actions}
          menu={{ runItem: shell.runItem, isInstalled: shell.install.isInstalled, canInstall: shell.install.canInstall }}
        />

        <StatusBanner install={shell.install} />

        <main className={`${CONTAINER_CLASS} app-main`}>
          <PlayersSection
            players={game.state.players}
            leaderId={game.ranking.leader?.id ?? null}
            onAddPlayer={game.addPlayer}
            onRename={game.renamePlayer}
            onRemove={game.removePlayer}
            onResetScore={game.resetPlayerScore}
            onAdjust={game.adjustScore}
            addCardRef={addCardRef}
            addInputRef={addInputRef}
          />
          <LeaderboardCard
            ref={leaderboardCardRef}
            ranking={game.ranking}
            onShare={handleShare}
            onRequestReset={actions.onRequestReset}
            onRequestClear={actions.onRequestClear}
          />
          {/* How it works + FAQ from index.html, below the tool (filled by usePageInfo). */}
          <div ref={pageInfoSlotRef} className={CARD_WIDTH_CLASS} />
        </main>

        <AppFooter runItem={shell.runItem} />
      </div>

      <ClearSessionDialog
        request={clearRequest}
        onRequestChange={setClearRequest}
        onConfirm={(scope) => {
          if (scope === "all") game.resetGame();
          else game.resetScores();
        }}
      />
      <ShellDialogs
        dialog={shell.dialog}
        openDialog={shell.openDialog}
        onClose={shell.closeDialog}
        onImported={(data) => {
          game.reloadFromStorage();
          setTheme(data.theme);
          void applyLanguage(data.lang);
        }}
        onCleared={() => {
          game.reloadFromStorage();
          setTheme("system");
          void applyLanguage(null);
        }}
      />
      <CrashTestHook />
    </>
  );
}
