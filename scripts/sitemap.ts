/**
 * sitemap.xml built from the dated sources of each page (growth → seo-geo §6): the app URL from the
 * latest CHANGELOG release, the policy pages from their "Last updated" line — never the build date.
 * Pure functions, used by scripts/generate.ts.
 */
import type { AppConfig } from "../app.config.ts";

const ISO_DATE = /\d{4}-\d{2}-\d{2}/;

/** Returns the date (YYYY-MM-DD) of the newest dated release in a Keep-a-Changelog file, if any. */
export function latestReleaseDate(changelog: string): string | undefined {
  for (const heading of changelog.match(/^## .*$/gm) ?? []) {
    if (/unreleased/i.test(heading)) continue;
    const date = ISO_DATE.exec(heading)?.[0];
    if (date) return date;
  }
  return undefined;
}

/**
 * Returns the sitemap `lastmod` of the app page: the newer of the config's `contentUpdated` and
 * the latest dated CHANGELOG release — the real last change, never the build date (seo-geo §6).
 */
export function pageLastmod(app: AppConfig, changelog: string): string {
  const release = latestReleaseDate(changelog);
  // ISO dates compare correctly as strings.
  return release !== undefined && release > app.seo.contentUpdated ? release : app.seo.contentUpdated;
}

/** A page below the app URL for the sitemap: its path (e.g. "privacy/") and its own last change. */
export interface SitemapPage {
  readonly path: string;
  readonly lastmod: string;
}

/**
 * Returns sitemap.xml: the canonical app URL, then `pages` (the policy pages, PLAN T-10), each with
 * its own `lastmod` (seo-geo §6); no priority/changefreq — ignored by Google.
 */
export function sitemapXml(app: AppConfig, lastmod: string, pages: readonly SitemapPage[] = []): string {
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    `  <url><loc>${app.url}</loc><lastmod>${lastmod}</lastmod></url>`,
    ...pages.map((page) => `  <url><loc>${app.url}${page.path}</loc><lastmod>${page.lastmod}</lastmod></url>`),
    `</urlset>`,
    "",
  ].join("\n");
}

/** A policy page as the sitemap needs it: its id (= URL folder) and its source's "Last updated" (YYYY-MM-DD). */
export interface DatedPolicyPage {
  readonly id: string;
  readonly updated: string;
}

/**
 * Returns the app's sitemap.xml with every `lastmod` taken from its own source (seo-geo §6): the app
 * URL from the latest CHANGELOG release ({@link pageLastmod}), each policy page from its "Last
 * updated" line — so pages that did not change keep their date and the build date never appears.
 */
export function appSitemapXml(app: AppConfig, changelog: string, policyPages: readonly DatedPolicyPage[]): string {
  const pages = policyPages.map((page) => ({ path: `${page.id}/`, lastmod: page.updated }));
  return sitemapXml(app, pageLastmod(app, changelog), pages);
}
