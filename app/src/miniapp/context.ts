// The standalone site's MiniAppContext (contract, Quizzard PLAN §1.2): the same services Quizzard gives
// the Scores screen, adapted to this page's own i18n, theme, toast, share and storage modules, so the
// screen behaves exactly as it did when it lived in app/src (PLAN GG-02). app.tsx builds it once.
import type { Lang, MiniAppContext, Signal } from "gg-counter-miniapp/contract";
import { STORAGE_AREA } from "gg-counter-miniapp/meta";
import { getLanguage, onLanguageChange } from "../i18n";
import { screenPrefs } from "../storage/prefs";
import type { ShowToast } from "../ui/toast";
import { shareOrCopy } from "../ui/web-share";

/** Class of the header slot elements (header.css: they add no box, so the buttons stay flex items of the bar). */
export const HEADER_SLOT_CLASS = "header-slot";

/** Inputs of {@link createStandaloneContext}. */
export interface StandaloneContextOptions {
  /** The page's toast function (ui/toast.tsx `useToast`). */
  readonly toast: ShowToast;
  /** The page; tests pass a fake. */
  readonly document?: Document;
}

/** The language signal over the page's i18next instance (i18n/index.ts). */
const languageSignal: Signal<Lang> = {
  get: getLanguage,
  subscribe: (listener) => onLanguageChange(() => { listener(getLanguage()); }),
};

/**
 * Returns the resolved-theme signal of `root`: providers/theme-provider.tsx (and theme-init.js before
 * the first paint) keep the class `light` or `dark` on it, also when System follows the device.
 */
function themeSignal(root: HTMLElement): Signal<"light" | "dark"> {
  const read = (): "light" | "dark" => (root.classList.contains("dark") ? "dark" : "light");
  return {
    get: read,
    subscribe: (listener) => {
      let last = read();
      const observer = new MutationObserver(() => {
        const next = read();
        if (next === last) return;
        last = next;
        listener(next);
      });
      observer.observe(root, { attributes: true, attributeFilter: ["class"] });
      return () => { observer.disconnect(); };
    },
  };
}

/** The page's toast, share and (no-op) title and busy services. */
function shellServices(toast: ShowToast): MiniAppContext["shell"] {
  return {
    // `tone` is dropped: the page's toasts have one look.
    toast: (message, options) => {
      const action = options?.action;
      toast(action === undefined ? { message } : { message, action: { label: action.label, run: () => { action.run(); } } });
    },
    // because the screen asks with its own alerts (choice dialogs); nothing calls this on this page
    confirm: () => Promise.reject(new Error("CONFIRM_UNSUPPORTED: the standalone page has no confirm service")),
    share: shareOrCopy,
    // The page's title is static, and its update offer never interrupts anything.
    setTitle: () => undefined,
    setBusy: () => undefined,
  };
}

/**
 * Builds the context the standalone page mounts the Scores screen with.
 * @remarks One screen, so `navigation` does nothing and there are no launch parameters (`?lang=` is
 * the page's); `notifySaved` does nothing because the page does not ask for persistent storage. The
 * header slot is a detached element that the page's header places (ui/app-header.tsx).
 */
export function createStandaloneContext({ toast, document: page = document }: StandaloneContextOptions): MiniAppContext {
  const headerActions = page.createElement("div");
  headerActions.className = HEADER_SLOT_CLASS;
  return {
    host: "standalone",
    language: languageSignal,
    theme: themeSignal(page.documentElement),
    query: new URLSearchParams(),
    shell: shellServices(toast),
    navigation: { home: () => undefined, open: () => undefined },
    slots: { headerActions },
    storage: { area: STORAGE_AREA, prefs: screenPrefs, notifySaved: () => undefined },
  };
}
