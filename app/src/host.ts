// The seam between the game screen (the "body": players, leaderboard, session actions, share) and
// whatever hosts it (Quizzard PLAN §1.5, GG-01): the body gets language, theme, toasts, sharing, its
// header slot, its overlay container and its root element only through a `Host`. The standalone site
// builds one here from its own modules; inside Quizzard (GG-02) the same shape is built from the
// mini-app contract's `MiniAppContext` (language, theme, shell.*, slots.headerActions, storage.notifySaved).
import type { LanguageCode } from "./config";
import { getLanguage, onLanguageChange } from "./i18n";
import type { ShowToast } from "./ui/toast";
import { shareOrCopy } from "./ui/web-share";

/** Stops a subscription; safe to call more than once. */
export type Unsubscribe = () => void;

/**
 * A value the host owns and the body only reads; `subscribe` fires after every change.
 * @remarks Members are function properties, not methods, so the body can pass `get`/`subscribe`
 * on unbound (e.g. to `useSyncExternalStore`); the contract's method-style `Signal` is assignable.
 */
export interface Signal<T> {
  readonly get: () => T;
  readonly subscribe: (listener: (value: T) => void) => Unsubscribe;
}

/** The theme the page shows now: a forced choice, or what the device prefers under System. */
export type ResolvedTheme = "light" | "dark";

/** Options of {@link Host.toast} (the contract's `shell.toast`). */
export interface HostToastOptions {
  /** A host with one toast look ignores it. */
  readonly tone?: "info" | "error";
  readonly action?: { readonly label: string; readonly run: () => void };
}

/** What {@link Host.share} shares (the contract's `shell.share`). */
export interface HostShareData {
  readonly title?: string;
  readonly text: string;
  readonly url?: string;
}

/** How sharing ended: handed to the share sheet, copied, cancelled by the user, or not possible. */
export type ShareOutcome = "shared" | "copied" | "cancelled" | "failed";

/** Everything the body takes from its host; it never reaches into the page around it directly. */
export interface Host {
  /** The UI language; the body's texts follow it. */
  readonly language: Signal<LanguageCode>;
  readonly theme: Signal<ResolvedTheme>;
  /** Shows a short message (the host owns the live region and its placement over dialogs). */
  readonly toast: (message: string, options?: HostToastOptions) => void;
  /** Shares text through the device's share sheet or the clipboard; never rejects. */
  readonly share: (data: HostShareData) => Promise<ShareOutcome>;
  /** Sets the screen's part of the page title; `null` = the app's own name. */
  readonly setTitle: (part: string | null) => void;
  /** While `true` the host offers no update (no reload under a running game). */
  readonly setBusy: (isBusy: boolean) => void;
  /** Called after the body saved data (the host may ask for persistent storage once). */
  readonly notifySaved: () => void;
  /** Where the body renders its header buttons (a React portal), in their final place in the header. */
  readonly headerActions: HTMLElement;
  /** Where the body's overlays (Radix dialogs, alerts, menus) are portalled. */
  readonly portalContainer: HTMLElement;
  /** The element the body puts its screen-wide custom properties on (keyboard inset, visual height). */
  readonly root: HTMLElement;
}

/** Inputs of {@link createStandaloneHost}. */
export interface StandaloneHostOptions {
  /** The page's toast function (ui/toast.tsx `useToast`). */
  readonly toast: ShowToast;
  /** The page; tests pass a fake. */
  readonly document?: Document;
}

/** Class of the header slot elements (header.css: they add no box, so the buttons stay flex items of the bar). */
export const HEADER_SLOT_CLASS = "header-slot";

/** The language signal over the shared i18next instance (i18n/index.ts). */
const languageSignal: Signal<LanguageCode> = {
  get: getLanguage,
  subscribe: (listener) => onLanguageChange(() => { listener(getLanguage()); }),
};

/**
 * Returns the resolved-theme signal of `root`: providers/theme-provider.tsx (and theme-init.js before
 * the first paint) keep the class `light` or `dark` on it, also when System follows the device.
 */
function themeSignal(root: HTMLElement): Signal<ResolvedTheme> {
  const read = (): ResolvedTheme => (root.classList.contains("dark") ? "dark" : "light");
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

/**
 * Builds the host the standalone page gives the body; behaviour is exactly the page's own.
 * @remarks Overlays portal into `<body>` and the custom properties go on `<html>`, as before the seam.
 * `setTitle`, `setBusy` and `notifySaved` do nothing: the page's title is static, its update offer
 * never interrupts anything, and it does not ask for persistent storage.
 */
export function createStandaloneHost({ toast, document: page = document }: StandaloneHostOptions): Host {
  const headerActions = page.createElement("div");
  headerActions.className = HEADER_SLOT_CLASS;
  return {
    language: languageSignal,
    theme: themeSignal(page.documentElement),
    // `tone` is dropped: the page's toasts have one look.
    toast: (message, options) => {
      const action = options?.action;
      toast(action === undefined ? { message } : { message, action: { label: action.label, run: action.run } });
    },
    share: shareOrCopy,
    setTitle: () => undefined,
    setBusy: () => undefined,
    notifySaved: () => undefined,
    headerActions,
    portalContainer: page.body,
    root: page.documentElement,
  };
}
