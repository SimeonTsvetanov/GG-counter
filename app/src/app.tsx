// The GG Counter page — the standalone shell around the game screen: header frame, status banner, menu,
// shell dialogs, footer and toasts (app/src/ui, PLAN T-08). The game screen itself (players, scores,
// leaderboard, share) is the package gg-counter-miniapp, mounted on the page's <main> through the same
// contract Quizzard uses (miniapp/, PLAN GG-02); what only this page adds around it goes through the
// package's host API (page info below the leaderboard, header layout, error screen, reload after import).
import { useRef, useState } from "react";
import { reloadGame, type StandaloneOptions } from "gg-counter-miniapp/host-api";
import { useInView } from "gg-counter-miniapp/hooks/use-in-view";
import { CONTAINER_CLASS, SCREEN_CLASS } from "gg-counter-miniapp/lib/layout";
import type { MiniAppContext } from "gg-counter-miniapp/contract";
import { StatusBanner } from "./components/status-banner";
import { usePageInfo } from "./hooks/use-page-info";
import { applyLanguage } from "./i18n";
import { useLanguage } from "./i18n/use-language";
import { createStandaloneContext } from "./miniapp/context";
import { useScoresScreen } from "./miniapp/use-scores-screen";
import { useTheme } from "./providers/theme-provider";
import { AppFooter } from "./ui/app-footer";
import { AppHeader } from "./ui/app-header";
import { CrashTestHook } from "./ui/error-boundary";
import { ShellDialogs } from "./ui/shell-dialogs";
import { useToast } from "./ui/toast";
import { useAppShell } from "./ui/use-app-shell";

/** Any part of the 1 px top marker on screen = the page is at the top (no header shadow). */
const AT_TOP_THRESHOLD = 0;

/** What the page keeps from the game screen's host API (host-api.ts) between renders. */
interface ScreenState {
  readonly options: StandaloneOptions;
  readonly isLeaderboardInView: boolean;
  readonly pageInfoBlock: HTMLElement | null;
}

/** Builds the context and the host-API extras once, and the state they report into. */
function useScreenHost(): { context: MiniAppContext } & ScreenState {
  const toast = useToast();
  const [isLeaderboardInView, setIsLeaderboardInView] = useState(true);
  const [pageInfoBlock, setPageInfoBlock] = useState<HTMLElement | null>(null);
  const [crash, setCrash] = useState<{ error: unknown } | null>(null);
  // Once: the context and the extras must keep their identity (useToast's function is stable).
  const [context] = useState(() => createStandaloneContext({ toast }));
  const [options] = useState<StandaloneOptions>(() => ({
    fillPageInfo: setPageInfoBlock,
    onLeaderboardInView: setIsLeaderboardInView,
    onCrash: (error) => { setCrash({ error }); },
  }));
  // A render error of the screen shows this page's error screen, as when it was part of this tree.
  if (crash !== null) throw crash.error;
  return { context, options, isLeaderboardInView, pageInfoBlock };
}

/** The whole GG Counter page: header, the game screen, install banner, how it works and FAQ, footer. */
export function App(): React.JSX.Element {
  // Re-renders the page's own texts when the language changes in Settings (the screen follows itself).
  const lang = useLanguage();
  const shell = useAppShell();
  const { setTheme } = useTheme();
  const { context, options, isLeaderboardInView, pageInfoBlock } = useScreenHost();

  const mainRef = useRef<HTMLElement>(null);
  useScoresScreen(mainRef, context, options);
  usePageInfo(pageInfoBlock, lang);
  const topSentinelRef = useRef<HTMLSpanElement>(null);
  const isAtTop = useInView(topSentinelRef, AT_TOP_THRESHOLD);
  const reloadScreen = (): void => { if (mainRef.current !== null) reloadGame(mainRef.current); };

  return (
    <>
      <div className="app">
        <span ref={topSentinelRef} className="scroll-sentinel" aria-hidden />
        <AppHeader
          isLeaderboardInView={isLeaderboardInView}
          isScrolled={!isAtTop}
          menu={{ runItem: shell.runItem, isInstalled: shell.install.isInstalled, canInstall: shell.install.canInstall }}
          headerActions={context.slots.headerActions}
        />

        <StatusBanner install={shell.install} />

        {/* The game screen (gg-counter-miniapp) renders its blocks in here; React leaves it empty. */}
        <main ref={mainRef} className={`${CONTAINER_CLASS} ${SCREEN_CLASS}`} />

        <AppFooter runItem={shell.runItem} />
      </div>

      <ShellDialogs
        dialog={shell.dialog}
        openDialog={shell.openDialog}
        onClose={shell.closeDialog}
        onImported={(data) => {
          reloadScreen();
          setTheme(data.theme);
          void applyLanguage(data.lang);
        }}
        onCleared={() => {
          reloadScreen();
          setTheme("system");
          void applyLanguage(null);
        }}
      />
      <CrashTestHook />
    </>
  );
}
