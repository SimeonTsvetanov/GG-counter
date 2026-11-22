// Where the game screen puts things on the page, decided per host (Quizzard PLAN §1.1 item 5, §1.5).
// Inside Quizzard everything stays inside the mount element: the screen's box, the overlay container for
// Radix portals, the custom properties (keyboard inset) and the theme class + `lang` the screen needs.
// On the standalone site the screen is the page: the mount element (its `<main>`) is the screen's box
// and overlays, custom properties, theme and language stay on `<body>` / `<html>` exactly as before.
import type { MiniAppContext, Unsubscribe } from "./contract.ts";
import { screenLanguage } from "./i18n";
import { CONTAINER_CLASS, SCREEN_CLASS } from "./lib/layout";

/** The elements mount.tsx renders into, and how to take away what it added. */
export interface Placement {
  /** The React root's container: the screen's blocks are its children. */
  readonly screen: HTMLElement;
  /** Where Radix portals the screen's dialogs and alerts. */
  readonly overlays: HTMLElement;
  /** The element that gets the screen-wide custom properties (`--keyboard-inset`, `--visual-height`). */
  readonly root: HTMLElement;
  /** Removes what this placement added: elements, classes and subscriptions (nothing on the page). */
  readonly remove: () => void;
}

/** Places the screen for one mount; mount.tsx calls it after the screen's texts are ready. */
export type PlaceScreen = (element: HTMLElement, context: MiniAppContext) => Placement;

/** Marks the overlay container inside the mount element (tests and devtools find it by it). */
export const OVERLAYS_ATTRIBUTE = "data-scores-overlays";

/**
 * The standalone page's placement: `element` itself is the screen (the page renders `<main
 * class="page-column app-main">` for it), overlays portal into `<body>` and the properties go on
 * `<html>`, so the page's DOM, the toasts inside open dialogs and the e2e tests see what they saw
 * before the split. Theme and `lang` stay on `<html>`, where the page keeps them.
 */
export const placeOnPage: PlaceScreen = (element) => {
  const page = element.ownerDocument;
  return { screen: element, overlays: page.body, root: page.documentElement, remove: () => undefined };
};

/**
 * Quizzard's placement: the screen's box and the overlay container are new children of `element`, the
 * properties go on `element`, and so do the theme class (`light`/`dark`, for the `dark:` variant of
 * theme.css) and `lang` (the screen's own language: English when a dictionary cannot load).
 */
export const placeInElement: PlaceScreen = (element, context) => {
  const page = element.ownerDocument;
  const screen = page.createElement("div");
  screen.className = `${CONTAINER_CLASS} ${SCREEN_CLASS}`;
  const overlays = page.createElement("div");
  overlays.setAttribute(OVERLAYS_ATTRIBUTE, "");
  element.append(screen, overlays);
  const stopScope = followScope(element, context);
  return {
    screen,
    overlays,
    root: element,
    remove: () => {
      stopScope();
      screen.remove();
      overlays.remove();
    },
  };
};

/** Places the screen for the context's host (the package entry, index.ts, mounts with it). */
export const placeForHost: PlaceScreen = (element, context) =>
  context.host === "standalone" ? placeOnPage(element, context) : placeInElement(element, context);

/** Keeps the theme class and `lang` on `element`; returns the function that stops and removes the class. */
function followScope(element: HTMLElement, context: MiniAppContext): Unsubscribe {
  const applyTheme = (theme: "light" | "dark"): void => {
    element.classList.toggle("dark", theme === "dark");
    element.classList.toggle("light", theme === "light");
  };
  const applyLanguage = (): void => { element.lang = screenLanguage.get(); };
  applyTheme(context.theme.get());
  applyLanguage();
  const stopTheme = context.theme.subscribe(applyTheme);
  const stopLanguage = screenLanguage.subscribe(applyLanguage);
  return () => {
    stopTheme();
    stopLanguage();
    element.classList.remove("light", "dark");
  };
}
