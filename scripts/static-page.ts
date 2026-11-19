/**
 * Static page text generated from app.config.ts (seo-geo §4): the "about, how it works, FAQ"
 * block that app/index.html carries before JavaScript runs, and the standalone 404 page.
 * Used by app/vite.config.ts (index.html) and scripts/generate.ts (404.html).
 *
 * The block uses the component classes of app/src/styles/components/page-info.css and disclosure.css
 * (PLAN T-12). The app's `usePageInfo` hook moves the `<section>` below the leaderboard on mount, drops
 * `[data-static-only]` (the h1: the React header has its own) and translates the parts marked
 * `data-i18n` (en.ts keys) and `data-text` (app.config texts) — keep the markers in sync. The static
 * HTML is English only: one English URL for crawlers (seo-geo §2, PLAN T-09).
 */
import type { AppConfig } from "../app.config.ts";
import { en } from "../app/src/i18n/en.ts";
import { cspMetaTag } from "./csp.ts";
import { escapeHtml } from "./seo.ts";
import { TOKENS_CSS, themeColorMetas } from "./tokens.ts";

/** The English texts of the block's headings and label, from the app's dictionary (one source). */
const PAGE = en.app.page;

/** Returns the steps as `<li>` items. */
function stepItems(app: AppConfig): string {
  return app.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("\n          ");
}

/** Returns one `<details>` per FAQ item — collapsed, so phones keep the text without the scroll (seo-geo §4). */
function faqItems(app: AppConfig): string {
  return app.faq
    .map(
      (item) =>
        `<details><summary>${escapeHtml(item.q)}</summary><p>${escapeHtml(item.a)}</p></details>`,
    )
    .join("\n          ");
}

/**
 * Returns the static block that follows `#root`: h1, answer sentences, steps and FAQ. `#root` is
 * one screen tall before React mounts, so the block starts below the fold — no flash of text.
 */
export function pageInfoHtml(app: AppConfig): string {
  return `<div data-page-info class="page-info-static">
      <section aria-label="${escapeHtml(PAGE.label.replace("{{name}}", app.name))}" data-i18n-aria-label="app.page.label" class="page-info">
        <h1 data-static-only>${escapeHtml(app.name)}</h1>
        <p data-text="answer">${escapeHtml(app.answer)}</p>
        <h2 data-i18n="app.page.howItWorks">${escapeHtml(PAGE.howItWorks)}</h2>
        <ol data-text="steps">
          ${stepItems(app)}
        </ol>
        <h2 data-i18n="app.page.faq">${escapeHtml(PAGE.faq)}</h2>
        <div data-text="faq" class="disclosures">
          ${faqItems(app)}
        </div>
      </section>
    </div>`;
}

/** Returns the `<noscript>` line shown inside `#root` when JavaScript is off. */
export function noscriptHtml(app: AppConfig): string {
  return `<noscript><p class="noscript">${escapeHtml(app.name)} needs JavaScript to keep score. How it works and the answers to common questions are below.</p></noscript>`;
}

/**
 * Returns 404.html: GitHub Pages serves it with status 404 for every unknown path, so its asset
 * URLs are absolute, it is `noindex`, and it links back to the app (seo-geo §6). Its meta CSP comes
 * first (security §1): the service worker also answers offline navigations with this page.
 */
export function notFoundHtml(app: AppConfig): string {
  const base = app.basePath;
  const name = escapeHtml(app.name);
  return `<!DOCTYPE html>
<html lang="${app.languages[0]}">
  <head>
    ${cspMetaTag()}
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="robots" content="noindex" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />
    ${themeColorMetas().join("\n    ")}
    <title>Page not found · ${name}</title>
    <link rel="icon" href="${base}favicon.svg" />
    <link rel="stylesheet" href="${base}${TOKENS_CSS}" />
    <link rel="stylesheet" href="${base}not-found.css" />
  </head>
  <body>
    <main class="not-found">
      <img src="${base}favicon.svg" alt="" width="64" height="64" />
      <h1>Page not found</h1>
      <p>This address is not part of ${name}; it may be an old or mistyped link.</p>
      <a class="not-found-button" href="${base}">Open ${name}</a>
    </main>
  </body>
</html>
`;
}
