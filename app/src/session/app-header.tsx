// The sticky header of the main screen. While the leaderboard card is in view it shows the title
// (the page's h1) next to ghost actions; once the card scrolls away it turns into a compact row of
// outline buttons and the h1 stays for screen readers only. The title never clips (WCAG 1.4.10, PLAN
// T-08): the decorative icon shows from 440 px up, and below ~360 px the buttons wrap to a second row.
import { LayoutList } from "lucide-react";
import meepleIconUrl from "../../meeple-plus.svg?url";
import { Button } from "../components/ui/button";
import { app } from "../config";
import { t } from "../i18n";
import { CONTAINER_CLASS } from "../lib/layout";
import { ActionBar, type ActionBarProps } from "./action-bar";

/** Props of {@link AppHeader}. */
interface AppHeaderProps extends Pick<ActionBarProps, "leaderboard" | "actions" | "menu"> {
  /** Whether the leaderboard card is on screen (picks the header layout). */
  isLeaderboardInView: boolean;
}

/** Scrolls the page back to the top (the compact header's meeple button). */
function scrollToTop(): void {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/** Renders the header in the layout that fits the scroll position. */
export function AppHeader({ isLeaderboardInView, leaderboard, actions, menu }: AppHeaderProps): React.JSX.Element {
  return (
    <header className="sticky top-0 z-20 bg-background/80 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className={CONTAINER_CLASS}>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-3">
          {isLeaderboardInView ? (
            <>
              {/* basis-0 + min-content: the title only takes a row of its own when even its longest word does not fit. */}
              <div className="flex min-w-[min-content] flex-1 basis-0 items-center gap-3">
                <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary min-[440px]:flex">
                  <LayoutList className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <h1 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    {app.name}
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {t("app.tagline")}
                  </p>
                </div>
              </div>
              <ActionBar
                variant="ghost"
                className="flex-shrink-0 flex items-center gap-2"
                leaderboard={leaderboard}
                actions={actions}
                menu={menu}
              />
            </>
          ) : (
            <>
              {/* The page keeps its one h1 while the compact header shows only the logo. */}
              <h1 className="sr-only">{app.name}</h1>
              <ActionBar
                variant="outline"
                className="flex w-full items-center justify-between gap-2"
                buttonClassName="shrink-0"
                leaderboard={leaderboard}
                actions={actions}
                menu={menu}
              >
                <Button
                  variant="outline"
                  size="icon"
                  onClick={scrollToTop}
                  className="shrink-0"
                  aria-label={t("shell.scrollToTop")}
                >
                  <img src={meepleIconUrl} alt={app.name} className="h-5 w-5" />
                </Button>
              </ActionBar>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
