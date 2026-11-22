// The seam between the game screen (players, leaderboard, session actions, share) and whatever hosts it
// (Quizzard PLAN §1.5, GG-01): the screen gets language, theme, toasts, sharing, its header slot, its
// overlay container and its root element only through a `Host`. mount.tsx builds it from the contract's
// `MiniAppContext` — the same way inside Quizzard and on the standalone site (app/src/miniapp).
import type { Lang, MiniAppContext, Unsubscribe } from "./contract.ts";

export type { Unsubscribe } from "./contract.ts";

/**
 * A value the host owns and the screen only reads; `subscribe` fires after every change.
 * @remarks Members are function properties, not methods, so the screen can pass `get`/`subscribe`
 * on unbound (e.g. to `useSyncExternalStore`); the contract's method-style `Signal` is wrapped.
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

/** Everything the screen takes from its host; it never reaches into the page around it directly. */
export interface Host {
  /** The screen's language (its own texts have switched when this fires); the texts follow it. */
  readonly language: Signal<Lang>;
  readonly theme: Signal<ResolvedTheme>;
  /** Shows a short message (the host owns the live region and its placement over dialogs). */
  readonly toast: (message: string, options?: HostToastOptions) => void;
  /** Shares text through the device's share sheet or the clipboard; never rejects. */
  readonly share: (data: HostShareData) => Promise<ShareOutcome>;
  /** Sets the screen's part of the page title; `null` = the app's own name. */
  readonly setTitle: (part: string | null) => void;
  /** While `true` the host offers no update (no reload under a running game). */
  readonly setBusy: (isBusy: boolean) => void;
  /** Called after the screen saved data (the host may ask for persistent storage once). */
  readonly notifySaved: () => void;
  /** Where the screen renders its header buttons (a React portal), in their final place in the header. */
  readonly headerActions: HTMLElement;
  /** Where the screen's overlays (Radix dialogs, alerts) are portalled. */
  readonly portalContainer: HTMLElement;
  /** The element the screen puts its screen-wide custom properties on (keyboard inset, visual height). */
  readonly root: HTMLElement;
}

/** The parts of a {@link Host} that mount.tsx decides per host (where things go on the page). */
export interface HostPlacement {
  /** The screen's own language signal (fires after its texts switched, i18n/index.ts). */
  readonly language: Signal<Lang>;
  readonly portalContainer: HTMLElement;
  readonly root: HTMLElement;
}

/**
 * Builds the screen's host from the contract's context and the placement mount.tsx chose.
 * @remarks Every service is a wrapper, so the screen never keeps the host's objects (or `this`).
 */
export function createHost(context: MiniAppContext, placement: HostPlacement): Host {
  const { shell, storage } = context;
  return {
    language: placement.language,
    theme: { get: () => context.theme.get(), subscribe: (listener) => context.theme.subscribe(listener) },
    toast: (message, options) => { shell.toast(message, options === undefined ? undefined : { ...options }); },
    share: (data) => shell.share({ ...data }),
    setTitle: (part) => { shell.setTitle(part); },
    setBusy: (isBusy) => { shell.setBusy(isBusy); },
    notifySaved: () => { storage.notifySaved(); },
    headerActions: context.slots.headerActions,
    portalContainer: placement.portalContainer,
    root: placement.root,
  };
}
