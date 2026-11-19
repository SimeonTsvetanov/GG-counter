// The sticky, frosted header of the main screen (design-system §8). While the leaderboard card is in
// view it shows the brand (the page's h1) next to the actions; once the card scrolls away it turns into a
// compact row of actions led by the logo (back to top) and the h1 stays for screen readers only. A shadow
// appears once the page has scrolled. The title never clips (WCAG 1.4.10): on phones the logo and the
// tagline step aside, and the brand wraps to its own row before anything is cut (header.css).
import { app } from "../config";
import { t } from "../i18n";
import { CONTAINER_CLASS } from "../lib/layout";
import { Button } from "../components/ui/button";
import { ActionBar, type ActionBarProps } from "./action-bar";

/** Props of {@link AppHeader}. */
interface AppHeaderProps extends Pick<ActionBarProps, "leaderboard" | "actions" | "menu"> {
  /** Whether the leaderboard card is on screen (picks the header layout). */
  isLeaderboardInView: boolean;
  /** Whether the page has scrolled away from the top (the header gets its shadow). */
  isScrolled: boolean;
}

/** The app icon (public/favicon.svg), also the logo in the header. */
const LOGO_URL = `${import.meta.env.BASE_URL}favicon.svg`;
/** Logo size in CSS px (header.css draws it at this size; the attributes reserve the space). */
const LOGO_SIZE = 28;

/** Scrolls the page back to the top (the compact header's logo button). */
function scrollToTop(): void {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/** Renders the header in the layout that fits the scroll position. */
export function AppHeader({ isLeaderboardInView, isScrolled, leaderboard, actions, menu }: AppHeaderProps): React.JSX.Element {
  return (
    <header className="app-header" data-scrolled={isScrolled ? "" : undefined}>
      <div className={`${CONTAINER_CLASS} app-header-bar`}>
        {isLeaderboardInView ? (
          <>
            <div className="brand">
              <img src={LOGO_URL} alt="" width={LOGO_SIZE} height={LOGO_SIZE} />
              <div>
                <h1 className="brand-name">{app.name}</h1>
                <p className="brand-tagline">{t("app.tagline")}</p>
              </div>
            </div>
            <ActionBar variant="ghost" className="header-actions" leaderboard={leaderboard} actions={actions} menu={menu} />
          </>
        ) : (
          <>
            {/* The page keeps its one h1 while the compact header shows only the logo. */}
            <h1 className="sr-only">{app.name}</h1>
            <ActionBar variant="outline" className="header-actions header-actions--compact" leaderboard={leaderboard} actions={actions} menu={menu}>
              <Button variant="ghost" size="icon" onClick={scrollToTop} aria-label={t("shell.scrollToTop")}>
                <img src={LOGO_URL} alt="" width={LOGO_SIZE} height={LOGO_SIZE} className="rounded-sm" />
              </Button>
            </ActionBar>
          </>
        )}
      </div>
    </header>
  );
}
