/**
 * Keeps a focused text field on screen (SPEC 1.2 F19, responsive-layout §5): the part of the page the user can
 * see is the visual viewport — on iOS the on-screen keyboard only shrinks that, not the layout viewport — minus
 * the sticky header at the top. These pure functions decide how far to scroll; the hook
 * `use-reveal-while-focused.ts` measures and scrolls.
 */
import type { ViewportBox } from "./keyboard-inset";

/** A vertical span in layout-viewport pixels (`getBoundingClientRect` coordinates). */
export interface Span {
  readonly top: number;
  readonly bottom: number;
}

/** Room kept between the field and the edge of the visible area. */
export const REVEAL_MARGIN = 12;
/** A visual viewport scaled by more than this is pinch-zoomed: the user is looking around, leave it alone. */
const ZOOM_TOLERANCE = 0.01;

/**
 * Returns the part of the layout viewport the user sees: from the bottom of the sticky header (`coveredTop`) or
 * the visual viewport's top, whichever is lower, to the visual viewport's bottom (the top of the keyboard).
 * Null while the page is pinch-zoomed. Without `VisualViewport` the whole layout viewport counts.
 */
export function visibleSpan(viewport: ViewportBox | null, layoutHeight: number, coveredTop: number): Span | null {
  if (viewport === null) return { top: Math.max(0, coveredTop), bottom: layoutHeight };
  if (Math.abs(viewport.scale - 1) > ZOOM_TOLERANCE) return null;
  return { top: Math.max(viewport.offsetTop, coveredTop), bottom: viewport.offsetTop + viewport.height };
}

/**
 * Returns how far to scroll the page (positive = down) so that `target` sits inside `visible` with `margin`
 * on both sides; 0 when it already does. A target taller than the room is aligned at its top (the field
 * first, its button below). Whole pixels only.
 */
export function revealOffset(target: Span, visible: Span, margin = REVEAL_MARGIN): number {
  const top = visible.top + margin;
  const bottom = visible.bottom - margin;
  const tooTall = target.bottom - target.top > bottom - top;
  let offset = 0;
  if (tooTall || target.top < top) offset = target.top - top;
  else if (target.bottom > bottom) offset = target.bottom - bottom;
  return Math.round(offset);
}
