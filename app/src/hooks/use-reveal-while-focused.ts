// Keeps a focused text field and its button inside the visible area — below the sticky header, above the
// on-screen keyboard (SPEC 1.2 F19). It acts on three triggers only, so it never fights the user's own scrolling:
// the field gets focus, `revision` changes while it has focus (a player was added above it), and the visual
// viewport is resized while it has focus (the keyboard opens, closes or changes height).
import { useEffect } from "react";
import { parsePixels, readToken } from "../lib/css-tokens";
import { REVEAL_MARGIN, revealOffset, visibleSpan } from "../lib/reveal";

/** Scrolls the page just enough to show `area` (the field and its button) in the visible span. */
function reveal(area: HTMLElement): void {
  const header = document.querySelector(".app-header")?.getBoundingClientRect().bottom ?? 0;
  const visible = visibleSpan(window.visualViewport ?? null, window.innerHeight, header);
  const box = area.getBoundingClientRect();
  const offset = revealOffset({ top: box.top, bottom: box.bottom }, visible, parsePixels(readToken("--space-3"), REVEAL_MARGIN));
  if (offset === 0) return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollBy({ top: offset, behavior: reduced ? "instant" : "smooth" });
}

/** Runs `reveal` on the next frame (after layout settles) while `field` still has focus. */
function scheduleReveal(field: HTMLElement, area: HTMLElement, frame: { id: number }): void {
  cancelAnimationFrame(frame.id);
  frame.id = requestAnimationFrame(() => {
    if (document.activeElement === field) reveal(area);
  });
}

/**
 * Keeps `fieldRef`'s element (and `areaRef`'s, which contains it with its button) on screen while it has focus.
 *
 * @param revision - any value that changes when the layout above the field changed (e.g. the player count).
 */
export function useRevealWhileFocused(fieldRef: React.RefObject<HTMLElement | null>, areaRef: React.RefObject<HTMLElement | null>, revision?: unknown): void {
  useEffect(() => {
    const field = fieldRef.current;
    const area = areaRef.current ?? field;
    if (field === null || area === null) return;
    const frame = { id: 0 };
    const onChange = (): void => { scheduleReveal(field, area, frame); };
    // because Android resizes the layout viewport (window resize), iOS only the visual one
    const viewport: EventTarget = window.visualViewport ?? window;
    field.addEventListener("focus", onChange);
    viewport.addEventListener("resize", onChange);
    return () => {
      cancelAnimationFrame(frame.id);
      field.removeEventListener("focus", onChange);
      viewport.removeEventListener("resize", onChange);
    };
  }, [fieldRef, areaRef]);

  useEffect(() => {
    const field = fieldRef.current;
    const area = areaRef.current ?? field;
    if (field === null || area === null || document.activeElement !== field) return;
    const frame = { id: 0 };
    scheduleReveal(field, area, frame);
    return () => { cancelAnimationFrame(frame.id); };
  }, [fieldRef, areaRef, revision]);
}
