// Moves the static "about, how it works, FAQ" block of index.html (generated from app.config.ts by
// scripts/static-page.ts, read by crawlers before JavaScript runs) into the main screen below the
// leaderboard, so people see the text that search engines index (seo-geo §4, mobile-first indexing).
// The static HTML is English (one English URL, seo-geo §2); in the app the block follows the UI
// language (PLAN T-09): headings from the dictionary, answer/steps/FAQ from app.config.ts `l10n`.
import { useLayoutEffect, type RefObject } from "react";
import { appText, t, type LanguageCode, type MessageKey } from "../i18n";
import { app } from "../config";

/** Marker of the static block's wrapper in index.html (scripts/static-page.ts `pageInfoHtml`). */
const PAGE_INFO_SELECTOR = "[data-page-info]";
/** Static-only parts: the h1 (the React header renders the page's one h1). */
const STATIC_ONLY_SELECTOR = "[data-static-only]";

/** Sets the text of each of `elements` to the same-position entry of `texts`. */
function fill(elements: Iterable<Element>, texts: readonly string[]): void {
  [...elements].forEach((element, index) => { element.textContent = texts[index] ?? ""; });
}

/**
 * Writes the block's texts in the active language. Only text nodes change (textContent, no HTML);
 * the number of steps and FAQ items is the same in every language (scripts/config-check.ts).
 */
function translate(section: Element): void {
  const text = appText();
  const values = { name: app.name };
  // because the static-page markers carry dictionary keys written by scripts/static-page.ts
  for (const element of section.querySelectorAll<HTMLElement>("[data-i18n]")) element.textContent = t(element.dataset.i18n as MessageKey, values);
  if (section instanceof HTMLElement && section.dataset.i18nAriaLabel !== undefined) section.setAttribute("aria-label", t(section.dataset.i18nAriaLabel as MessageKey, values));
  fill(section.querySelectorAll('[data-text="answer"]'), [text.answer]);
  fill(section.querySelectorAll('[data-text="steps"] > li'), text.steps);
  fill(section.querySelectorAll('[data-text="faq"] summary'), text.faq.map((item) => item.q));
  fill(section.querySelectorAll('[data-text="faq"] details > p'), text.faq.map((item) => item.a));
}

/**
 * Moves the static page-info section into `slotRef`'s element on mount, before the first paint, and
 * keeps its text in `lang`.
 *
 * @param slotRef - an element React renders without children, so changing DOM inside it is safe from
 *   reconciliation (React only manages the slot itself).
 * @param lang - the active UI language; a change re-translates the block.
 * @remarks The move runs once; a second run (StrictMode) finds no static block left and only translates.
 */
export function usePageInfo(slotRef: RefObject<HTMLDivElement | null>, lang: LanguageCode): void {
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

  useLayoutEffect(() => {
    const section = slotRef.current?.querySelector("section");
    // English writes the same text the static HTML has; a dozen text nodes, so no need to skip it.
    if (section) translate(section);
  }, [slotRef, lang]);
}
