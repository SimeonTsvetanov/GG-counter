// The game screen — the root component mount.tsx renders: it owns the game state and the dialog state
// shared between the header buttons, the player cards and the leaderboard card. It takes language,
// toasts, sharing, its header slot and its root only from the host (host.ts); what only the standalone
// page adds around it (host-api.ts) arrives as `options`.
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useGameState } from "./hooks/use-game-state";
import { useInView } from "./hooks/use-in-view";
import { RELOAD_GAME_EVENT, type StandaloneOptions } from "./host-api.ts";
import { t } from "./i18n";
import { LeaderboardCard } from "./leaderboard/leaderboard-card";
import { trackKeyboardInset } from "./lib/keyboard-inset";
import { CARD_WIDTH_CLASS } from "./lib/layout";
import { PlayersSection } from "./players/players-section";
import { useHost, useHostLanguage } from "./providers/host-provider";
import { ActionBar, type SessionActions } from "./session/action-bar";
import { ClearSessionDialog, type ClearScope } from "./session/clear-session-dialog";
import { shareLeaderboard } from "./share/share-leaderboard";

/** Share of the leaderboard card that must be on screen for the full header layout. */
const LEADERBOARD_IN_VIEW_THRESHOLD = 0.15;

/** Props of {@link ScoresScreen}. */
export interface ScoresScreenProps {
  /** The element the screen's blocks are children of (positioned: the cards slide against it). */
  readonly screen: HTMLElement;
  /** The mount element; the host's events (host-api.ts) arrive on it. */
  readonly element: HTMLElement;
  readonly options: StandaloneOptions;
}

/** Renders the block below the leaderboard the standalone page fills, and fills it before paint. */
function PageInfoBlock({ fill }: { readonly fill: (block: HTMLElement) => void }): React.JSX.Element {
  const blockRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (blockRef.current !== null) fill(blockRef.current);
  }, [fill]);
  return <div ref={blockRef} className={CARD_WIDTH_CLASS} data-flip="main:info" />;
}

/** Tells the host whether the leaderboard card is in view, before paint (its header switches layout). */
function useReportInView(isInView: boolean, report: StandaloneOptions["onLeaderboardInView"]): void {
  useLayoutEffect(() => { report?.(isInView); }, [isInView, report]);
}

/** Shows the saved game again when the host asks (host-api.ts `reloadGame`). */
function useReloadRequests(element: HTMLElement, reload: () => void): void {
  useEffect(() => {
    element.addEventListener(RELOAD_GAME_EVENT, reload);
    return () => { element.removeEventListener(RELOAD_GAME_EVENT, reload); };
  }, [element, reload]);
}

/** The whole game screen: players, scores, leaderboard, share and the session's header buttons. */
export function ScoresScreen({ screen, element, options }: ScoresScreenProps): React.JSX.Element {
  // Re-renders the whole screen (every t() call in it) when the language changes.
  useHostLanguage();
  const host = useHost();
  const game = useGameState(host.notifySaved);
  const [isLeaderboardDialogOpen, setIsLeaderboardDialogOpen] = useState(false);
  // The one Clear session alert: which option it opens with, or null while it is closed.
  const [clearRequest, setClearRequest] = useState<ClearScope | null>(null);

  const addInputRef = useRef<HTMLInputElement>(null);
  const screenRef = useRef(screen);
  const leaderboardCardRef = useRef<HTMLDivElement>(null);
  const isLeaderboardInView = useInView(leaderboardCardRef, LEADERBOARD_IN_VIEW_THRESHOLD);
  useReportInView(isLeaderboardInView, options.onLeaderboardInView);
  useReloadRequests(element, game.reloadFromStorage);
  // Bottom sheets stay above the on-screen keyboard (iOS Safari needs the measured inset).
  useLayoutEffect(() => trackKeyboardInset({ style: host.root.style }), [host]);

  const handleShare = () => {
    void shareLeaderboard(game.state.players, host.share).then((outcome) => {
      if (outcome === "shared" || outcome === "copied") setIsLeaderboardDialogOpen(false);
      if (outcome === "copied") host.toast(t("app.copiedSummary"));
      if (outcome === "failed") host.toast(t("app.shareFailed"));
    });
  };

  const actions: SessionActions = {
    // The field scrolls itself into the visible area on focus (useRevealWhileFocused, SPEC 1.2 F19).
    onQuickAdd: () => { addInputRef.current?.focus({ preventScroll: true }); },
    onShare: handleShare,
    onRequestReset: () => { setClearRequest("scores"); },
    onRequestClear: () => { setClearRequest("all"); },
  };

  return (
    <>
      <ActionBar
        variant={isLeaderboardInView ? "ghost" : "outline"}
        leaderboard={{ open: isLeaderboardDialogOpen, onOpenChange: setIsLeaderboardDialogOpen, players: game.ranking.players }}
        actions={actions}
      />
      <PlayersSection
        players={game.state.players}
        ranking={game.ranking}
        lastScoredId={game.lastScoredId}
        onAddPlayer={game.addPlayer}
        onRename={game.renamePlayer}
        onRemove={game.removePlayer}
        onResetScore={game.resetPlayerScore}
        onAdjust={game.adjustScore}
        onRemoveEntry={game.removeScoreEntry}
        onRestoreEntry={game.restoreScoreEntry}
        flipRootRef={screenRef}
        addInputRef={addInputRef}
      />
      <LeaderboardCard
        ref={leaderboardCardRef}
        ranking={game.ranking}
        onShare={handleShare}
        onRequestReset={actions.onRequestReset}
        onRequestClear={actions.onRequestClear}
      />
      {options.fillPageInfo !== undefined && <PageInfoBlock fill={options.fillPageInfo} />}
      <ClearSessionDialog
        request={clearRequest}
        onRequestChange={setClearRequest}
        onConfirm={(scope) => {
          if (scope === "all") game.resetGame();
          else game.resetScores();
        }}
      />
    </>
  );
}
