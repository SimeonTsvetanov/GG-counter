// Moves the static "about, how it works, FAQ" block of index.html (generated from app.config.ts by
// scripts/static-page.ts, read by crawlers before JavaScript runs) into the main screen below the
// leaderboard, so people see the text that search engines index (seo-geo §4, mobile-first indexing).
import { useLayoutEffect, type RefObject } from "react";

/** Marker of the static block's wrapper in index.html (scripts/static-page.ts `pageInfoHtml`). */
const PAGE_INFO_SELECTOR = "[data-page-info]";
/** Static-only parts: the h1 (the React header renders the page's one h1). */
const STATIC_ONLY_SELECTOR = "[data-static-only]";

/**
 * Moves the static page-info section into `slotRef`'s element on mount, before the first paint.
 *
 * @param slotRef - an element React renders without children, so moving DOM into it is safe from
 *   reconciliation (React only manages the slot itself).
 * @remarks Runs once; a second run (StrictMode) finds no static block left and does nothing.
 */
export function usePageInfo(slotRef: RefObject<HTMLDivElement | null>): void {
  useLayoutEffect(() => {
    const slot = slotRef.current;
    const block = document.querySelector(PAGE_INFO_SELECTOR);
    const section = block?.querySelector("section");
    if (!slot || !block || !section) {
      return;
    }
    for (const element of section.querySelectorAll(STATIC_ONLY_SELECTOR)) {
      element.remove();
    }
    slot.append(section);
    block.remove();
  }, [slotRef]);
}
