// The sticky header of the main screen. While the leaderboard card is in view it shows the title
// next to ghost actions; once the card scrolls away it turns into a compact row of outline buttons.
import { LayoutList } from "lucide-react";
import meepleIconUrl from "../../meeple-plus.svg?url";
import { Button } from "../components/ui/button";
import { CONTAINER_CLASS } from "../lib/layout";
import { ActionBar, type ActionBarProps } from "./action-bar";

/** Props of {@link AppHeader}. */
interface AppHeaderProps extends Pick<ActionBarProps, "leaderboard" | "actions"> {
  /** Whether the leaderboard card is on screen (picks the header layout). */
  isLeaderboardInView: boolean;
}

/** Scrolls the page back to the top (the compact header's meeple button). */
function scrollToTop(): void {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/** Renders the header in the layout that fits the scroll position. */
export function AppHeader({ isLeaderboardInView, leaderboard, actions }: AppHeaderProps): React.JSX.Element {
  return (
    <header className="sticky top-0 z-20 bg-background/80 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className={CONTAINER_CLASS}>
        <div className="flex items-center justify-between gap-3 py-3">
          {isLeaderboardInView ? (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <LayoutList className="h-5 w-5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    GG Counter
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Boardgames score tracker
                  </p>
                </div>
              </div>
              <ActionBar
                variant="ghost"
                className="flex-shrink-0 flex items-center gap-2"
                leaderboard={leaderboard}
                actions={actions}
              />
            </>
          ) : (
            <ActionBar
              variant="outline"
              className="flex w-full items-center justify-between gap-2"
              buttonClassName="shrink-0"
              leaderboard={leaderboard}
              actions={actions}
            >
              <Button
                variant="outline"
                size="icon"
                onClick={scrollToTop}
                className="shrink-0"
                aria-label="Scroll to top"
              >
                <img src={meepleIconUrl} alt="GG Counter" className="h-5 w-5" />
              </Button>
            </ActionBar>
          )}
        </div>
      </div>
    </header>
  );
}
