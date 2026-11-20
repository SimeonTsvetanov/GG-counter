/**
 * Keeps bottom sheets above the on-screen keyboard (pwa → keyboard; DECISIONS 2026-11-20).
 * Android Chrome and Firefox resize the layout viewport themselves through the viewport meta
 * `interactive-widget=resizes-content` (app/index.html), so `bottom: 0` is already above the keyboard.
 * iOS Safari ignores that key and only shrinks the visual viewport, so the covered height is published
 * as `--keyboard-inset` (and the visible height as `--visual-height`) for the sheet CSS to use.
 */

/** The parts of `VisualViewport` this module reads. */
export interface ViewportBox {
  readonly height: number;
  readonly offsetTop: number;
  readonly scale: number;
}

/** A `VisualViewport` that also reports its changes. */
interface WatchedViewport extends ViewportBox {
  addEventListener: (type: "resize" | "scroll", listener: () => void) => void;
  removeEventListener: (type: "resize" | "scroll", listener: () => void) => void;
}

/** Where {@link trackKeyboardInset} reads from and writes to; the defaults are the real page. */
interface TrackOptions {
  readonly viewport?: WatchedViewport | null;
  readonly style?: { setProperty: (name: string, value: string) => void };
  readonly layoutHeight?: () => number;
}

/**
 * Returns how many CSS pixels at the bottom of the layout viewport the keyboard covers.
 * Pinch zoom also shrinks the visual viewport, so a zoomed page reports 0.
 */
export function keyboardInset(layoutHeight: number, viewport: ViewportBox): number {
  if (Math.abs(viewport.scale - 1) > 0.01) return 0;
  const covered = Math.round(layoutHeight - viewport.height - viewport.offsetTop);
  return covered > 1 ? covered : 0;
}

/**
 * Publishes `--keyboard-inset` and `--visual-height` on the root element now and whenever the visual
 * viewport changes. Returns a function that stops it. Does nothing without `VisualViewport`.
 */
export function trackKeyboardInset(options: TrackOptions = {}): () => void {
  const viewport = options.viewport === undefined ? window.visualViewport : options.viewport;
  if (!viewport) return () => undefined;
  const style = options.style ?? document.documentElement.style;
  const layoutHeight = options.layoutHeight ?? (() => window.innerHeight);
  const update = (): void => {
    style.setProperty("--keyboard-inset", `${String(keyboardInset(layoutHeight(), viewport))}px`);
    style.setProperty("--visual-height", `${String(Math.round(viewport.height))}px`);
  };
  update();
  viewport.addEventListener("resize", update);
  viewport.addEventListener("scroll", update);
  return () => {
    viewport.removeEventListener("resize", update);
    viewport.removeEventListener("scroll", update);
  };
}
