// Moves the static "about, how it works, FAQ" block of index.html (generated from app.config.ts by
// scripts/static-page.ts, read by crawlers before JavaScript runs) into the game screen below the
// leaderboard (the block it renders for the page, host-api `fillPageInfo`), so people see the text that
// search engines index (seo-geo §4, mobile-first indexing).
// The static HTML is English (one English URL, seo-geo §2); in the app the block follows the UI
// language (PLAN T-09): headings from the dictionary, answer/steps/FAQ from app.config.ts `l10n`.
import { useLayoutEffect } from "react";
import { appText, t, type LanguageCode, type MessageKey } from "../i18n";
import { app } from "../config";

/** Marker of the static block's wrapper in index.html (scripts/static-page.ts `pageInfoHtml`). */
const PAGE_INFO_SELECTOR = "[data-page-info]";
/** Static-only parts: the h1 (the React header renders the page's one h1). */
const STATIC_ONLY_SELECTOR = "[data-static-only]";

/** The section once it left the static block (kept, so a remounted screen gets it back). */
let movedSection: Element | null = null;

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
 * Moves the static page-info section into `slot` before the first paint, and keeps its text in `lang`.
 *
 * @param slot - the block the game screen renders below the leaderboard (host-api `fillPageInfo`), or
 *   null before it exists; the screen renders it without children, so changing DOM inside it is safe
 *   from reconciliation. A new block (the screen mounted again) gets the section moved into it.
 * @param lang - the active UI language; a change re-translates the block.
 * @remarks The static block is read once; later runs find it gone and move the section it held.
 */
export function usePageInfo(slot: HTMLElement | null, lang: LanguageCode): void {
  useLayoutEffect(() => {
    if (slot === null) return;
    const block = document.querySelector(PAGE_INFO_SELECTOR);
    const section = block?.querySelector("section") ?? movedSection;
    if (!section) {
      return;
    }
    for (const element of section.querySelectorAll(STATIC_ONLY_SELECTOR)) {
      element.remove();
    }
    slot.append(section);
    movedSection = section;
    block?.remove();
  }, [slot]);

  useLayoutEffect(() => {
    // English writes the same text the static HTML has; a dozen text nodes, so no need to skip it.
    if (slot !== null && movedSection !== null && slot.contains(movedSection)) translate(movedSection);
  }, [slot, lang]);
}
