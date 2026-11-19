/**
 * Static page text generated from app.config.ts (seo-geo §4): the "about, how it works, FAQ"
 * block that app/index.html carries before JavaScript runs, and the standalone 404 page.
 * Used by app/vite.config.ts (index.html) and scripts/generate.ts (404.html).
 *
 * The block's Tailwind classes are written out here in full because app/tailwind.config.ts scans
 * this file. The app's `usePageInfo` hook moves the `<section>` below the leaderboard on mount and
 * drops `[data-static-only]` (the h1: the React header has its own) — keep the markers in sync.
 */
import type { AppConfig } from "../app.config.ts";
import { escapeHtml } from "./seo.ts";

/** Returns the steps as `<li>` items. */
function stepItems(app: AppConfig): string {
  return app.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("\n          ");
}

/** Returns one `<details>` per FAQ item — collapsed, so phones keep the text without the scroll (seo-geo §4). */
function faqItems(app: AppConfig): string {
  return app.faq
    .map(
      (item) =>
        `<details class="rounded-md bg-muted/40 px-3 py-2 shadow-sm">` +
        `<summary class="cursor-pointer py-1 font-medium">${escapeHtml(item.q)}</summary>` +
        `<p class="pb-1 pt-2 text-muted-foreground">${escapeHtml(item.a)}</p></details>`,
    )
    .join("\n          ");
}

/**
 * Returns the static block that follows `#root`: h1, answer sentences, steps and FAQ. `#root` is
 * one screen tall before React mounts, so the block starts below the fold — no flash of text.
 */
export function pageInfoHtml(app: AppConfig): string {
  return `<div data-page-info class="safe-area">
      <section aria-label="About ${escapeHtml(app.name)}" class="mx-auto w-full max-w-lg space-y-4 rounded-lg bg-card p-6 text-sm text-card-foreground shadow-md">
        <h1 data-static-only class="text-base font-semibold">${escapeHtml(app.name)}</h1>
        <p class="text-muted-foreground">${escapeHtml(app.answer)}</p>
        <h2 class="text-base font-semibold">How it works</h2>
        <ol class="list-decimal space-y-1 pl-5 text-muted-foreground">
          ${stepItems(app)}
        </ol>
        <h2 class="text-base font-semibold">Frequently asked questions</h2>
        <div class="space-y-2">
          ${faqItems(app)}
        </div>
      </section>
    </div>`;
}

/** Returns the `<noscript>` line shown inside `#root` when JavaScript is off. */
export function noscriptHtml(app: AppConfig): string {
  return `<noscript><p class="p-6 text-center text-sm">${escapeHtml(app.name)} needs JavaScript to keep score. How it works and the answers to common questions are below.</p></noscript>`;
}

/**
 * Returns 404.html: GitHub Pages serves it with status 404 for every unknown path, so its asset
 * URLs are absolute, it is `noindex`, and it links back to the app (seo-geo §6).
 */
export function notFoundHtml(app: AppConfig): string {
  const base = app.basePath;
  const name = escapeHtml(app.name);
  return `<!DOCTYPE html>
<html lang="${app.languages[0]}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="robots" content="noindex" />
    <meta name="referrer" content="strict-origin-when-cross-origin" />
    <meta name="theme-color" content="${app.manifest.themeColor}" />
    <title>Page not found · ${name}</title>
    <link rel="icon" href="${base}favicon.svg" />
    <link rel="stylesheet" href="${base}not-found.css" />
  </head>
  <body>
    <main class="not-found">
      <img src="${base}favicon.svg" alt="" width="64" height="64" />
      <h1>Page not found</h1>
      <p>This address is not part of ${name}; it may be an old or mistyped link.</p>
      <a class="not-found__button" href="${base}">Open ${name}</a>
    </main>
  </body>
</html>
`;
}
