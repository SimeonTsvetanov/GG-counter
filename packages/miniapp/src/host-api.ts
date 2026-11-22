// What a host may add around the Scores screen beyond the contract (Quizzard PLAN §1.5). The standalone
// site uses it for what only its page has: the "how it works + FAQ" block below the leaderboard, the
// header that changes its layout while the leaderboard card is in view, its own error screen, and
// showing the game again after Settings → Import or Clear my data without a remount. Quizzard needs none
// of it (it remounts after a clear, contract `MiniAppModule`) and never imports this module.

/** The standalone page's extras for one mount element; every member is optional. */
export interface StandaloneOptions {
  /**
   * Fills the block the screen renders below the leaderboard (only when this is set). Called with the
   * empty block before the first paint of each mount.
   */
  readonly fillPageInfo?: (block: HTMLElement) => void;
  /** Called before paint whenever the leaderboard card enters or leaves the view (and once at mount). */
  readonly onLeaderboardInView?: (isInView: boolean) => void;
  /** Gets an error thrown while the screen renders; without it the error goes to the window's `error` event. */
  readonly onCrash?: (error: unknown) => void;
}

/** Event on the mount element that makes the screen show the game saved in storage now. */
export const RELOAD_GAME_EVENT = "scores:reload-game";

const optionsByElement = new WeakMap<HTMLElement, StandaloneOptions>();

/**
 * Sets the standalone extras of a mount element; call it before `mount`.
 * @param element - the element the screen is mounted on
 * @param options - the extras; replaces earlier ones
 */
export function setStandaloneOptions(element: HTMLElement, options: StandaloneOptions): void {
  optionsByElement.set(element, options);
}

/**
 * Returns the standalone extras of a mount element (none when the host set nothing).
 * @param element - the mount element
 */
export function standaloneOptions(element: HTMLElement): StandaloneOptions {
  return optionsByElement.get(element) ?? {};
}

/**
 * Makes the mounted screen show the game saved in storage now (after an import or a clear), without
 * saving it again, so a cleared game is not written back.
 * @param element - the mount element
 */
export function reloadGame(element: HTMLElement): void {
  element.dispatchEvent(new Event(RELOAD_GAME_EVENT));
}
