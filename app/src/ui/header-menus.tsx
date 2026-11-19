// The header's two menus as lazy chunks (PLAN T-12, performance §1): the app menu and, from 600 px up,
// the theme menu. Each shows a stand-in button with the same look and name until its code has loaded
// (lazy-menu.tsx); the chunks start loading with the first render, so the stand-in is rarely seen.
import { lazy, Suspense } from "react";
import { Menu, Sun } from "lucide-react";
import { t } from "../i18n";
import type { AppMenuProps } from "./app-menu";
import { MenuStandIn, useMenuIntent } from "./lazy-menu";

const AppMenu = lazy(() => import("./app-menu").then((module) => ({ default: module.AppMenu })));
const ThemeToggle = lazy(() => import("../components/theme-toggle").then((module) => ({ default: module.ThemeToggle })));

/** The app menu button (Menu). */
export function HeaderAppMenu(props: AppMenuProps): React.JSX.Element {
  const { intent, handlers } = useMenuIntent();
  const standIn = <MenuStandIn variant={props.variant} aria-label={t("shell.menu.open")} data-menu-open="" icon={<Menu aria-hidden />} {...handlers} />;
  return (
    <Suspense fallback={standIn}>
      <AppMenu {...props} initialIntent={intent} />
    </Suspense>
  );
}

/** The theme menu button (Light / Dark / System), shown from 600 px up. */
export function HeaderThemeMenu({ className }: { className: string }): React.JSX.Element {
  const { intent, handlers } = useMenuIntent();
  const standIn = <MenuStandIn variant="ghost" className={className} aria-label={t("shell.theme.toggle")} icon={<Sun aria-hidden />} {...handlers} />;
  return (
    <Suspense fallback={standIn}>
      <ThemeToggle className={className} initialIntent={intent} />
    </Suspense>
  );
}
