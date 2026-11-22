// The sticky, frosted header of the main screen (design-system §8) — the page's frame around the game
// screen. While the leaderboard card is in view it shows the brand (the page's h1) next to the actions;
// once the card scrolls away it turns into a compact row of actions led by the logo (back to top) and
// the h1 stays for screen readers only. A shadow appears once the page has scrolled. The title never
// clips (WCAG 1.4.10): on phones the logo and the tagline step aside, and the brand wraps to its own row
// before anything is cut (header.css). The session buttons come from the game screen through the
// host's header slot (host.ts, session/action-bar.tsx), between the logo button and Theme + Menu.
import { useLayoutEffect, useRef } from "react";
import { app } from "../config";
import { HEADER_SLOT_CLASS } from "../host";
import { t } from "../i18n";
import { CONTAINER_CLASS } from "../lib/layout";
import { Button } from "../components/ui/button";
import { useHost } from "../providers/host-provider";
import type { AppMenuProps } from "../ui/app-menu";
import { HeaderAppMenu, HeaderThemeMenu } from "../ui/header-menus";

/** Props of {@link AppHeader}. */
interface AppHeaderProps {
  /** Whether the leaderboard card is on screen (picks the header layout). */
  isLeaderboardInView: boolean;
  /** Whether the page has scrolled away from the top (the header gets its shadow). */
  isScrolled: boolean;
  /** The app menu at the end of the actions (its button takes the layout's style). */
  menu: Omit<AppMenuProps, "variant">;
}

/** Props of {@link HeaderActions}. */
interface HeaderActionsProps extends Pick<AppHeaderProps, "menu"> {
  /** Button style: plain next to the title, on the fill colour in the compact layout. */
  variant: "ghost" | "outline";
  /** Layout classes of the row itself. */
  className: string;
  /** Optional button placed before the actions. */
  children?: React.ReactNode;
}

/** The app icon (public/favicon.svg), also the logo in the header. */
const LOGO_URL = `${import.meta.env.BASE_URL}favicon.svg`;
/** Logo size in CSS px (header.css draws it at this size; the attributes reserve the space). */
const LOGO_SIZE = 28;

/** Scrolls the page back to the top (the compact header's logo button). */
function scrollToTop(): void {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * Places the host's header slot here. Both elements add no box (header.css), so the game screen's
 * buttons stay flex items of the row, in the same order, and the slot never moves between layouts.
 */
function HeaderSlot(): React.JSX.Element {
  const { headerActions } = useHost();
  const outletRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    outletRef.current?.append(headerActions);
    return () => { headerActions.remove(); };
  }, [headerActions]);
  return <div ref={outletRef} className={HEADER_SLOT_CLASS} />;
}

/** The row of icon buttons: optional leading button, the game screen's buttons, Theme (from 600 px) and Menu. */
function HeaderActions({ variant, className, menu, children }: HeaderActionsProps): React.JSX.Element {
  return (
    <div className={className}>
      {children}
      <HeaderSlot />
      <HeaderThemeMenu className="header-theme" />
      <HeaderAppMenu {...menu} variant={variant} />
    </div>
  );
}

/** Renders the header in the layout that fits the scroll position. */
export function AppHeader({ isLeaderboardInView, isScrolled, menu }: AppHeaderProps): React.JSX.Element {
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
            <HeaderActions variant="ghost" className="header-actions" menu={menu} />
          </>
        ) : (
          <>
            {/* The page keeps its one h1 while the compact header shows only the logo. */}
            <h1 className="sr-only">{app.name}</h1>
            <HeaderActions variant="outline" className="header-actions header-actions--compact" menu={menu}>
              <Button variant="ghost" size="icon" onClick={scrollToTop} aria-label={t("shell.scrollToTop")}>
                <img src={LOGO_URL} alt="" width={LOGO_SIZE} height={LOGO_SIZE} className="rounded-sm" />
              </Button>
            </HeaderActions>
          </>
        )}
      </div>
    </header>
  );
}
