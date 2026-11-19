/**
 * Search and agent files built from app.config.ts (growth → seo-geo §2–8). Pure functions, used by
 * scripts/generate.ts (sitemap.xml, robots.txt, llms.txt) and app/vite.config.ts (the static head).
 */
import type { AppConfig } from "../app.config.ts";

/** The committed social image (seo-geo §3: 1200×630 PNG; made by `pnpm og-image`). */
export const OG_IMAGE = { file: "og-image.png", width: 1200, height: 630, type: "image/png" } as const;

const ISO_DATE = /\d{4}-\d{2}-\d{2}/;

/** Named crawler groups of the forge robots.txt template (seo-geo §7). */
const ROBOTS_GROUPS: readonly { readonly title: string; readonly agents: readonly string[] }[] = [
  { title: "Search and answer crawlers", agents: ["Googlebot", "Bingbot", "OAI-SearchBot", "Claude-SearchBot", "PerplexityBot", "Applebot"] },
  { title: "User-triggered fetchers (may not follow robots.txt)", agents: ["ChatGPT-User", "Claude-User", "Perplexity-User"] },
  { title: "Training tokens", agents: ["GPTBot", "ClaudeBot", "Google-Extended", "Applebot-Extended", "CCBot"] },
];

/** Returns text safe for HTML text and double-quoted attributes. */
export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Returns the `<title>` text: "{name} — {tagline}" (≤ 60 characters, checked by the tests). */
export function pageTitle(app: AppConfig): string {
  return `${app.name} — ${app.tagline}`;
}

/** Returns the absolute og-image URL. */
export function ogImageUrl(app: AppConfig): string {
  return `${app.url}${OG_IMAGE.file}`;
}

/** Returns the og-image alt text — the image shows the logo, the name and the tagline. */
export function ogImageAlt(app: AppConfig): string {
  return `${app.name} meeple logo with the tagline: ${app.tagline}`;
}

/**
 * Returns the JSON-LD items of the app page: WebApplication (entity data, never ratings) and
 * FAQPage (data only; its questions equal the visible FAQ) — seo-geo §5.
 */
export function structuredData(app: AppConfig): readonly object[] {
  const webApplication = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: app.name,
    url: app.url,
    description: app.description,
    image: ogImageUrl(app),
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Any — runs in the browser",
    browserRequirements: "Requires JavaScript and a current browser (Chrome, Edge, Firefox or Safari).",
    offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
    isAccessibleForFree: true,
    inLanguage: app.languages[0],
    softwareVersion: app.version,
    author: { "@type": "Person", name: app.author.name, sameAs: [app.author.github] },
    sameAs: [app.repo],
    featureList: [...app.features],
  };
  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: app.faq.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
  };
  return [webApplication, faqPage];
}

/** Returns the JSON-LD block, safe inside `<script>` (no "</script>" can appear). */
function jsonLdScript(app: AppConfig): string {
  const json = JSON.stringify(structuredData(app)).replace(/</g, "\\u003c");
  return `<script type="application/ld+json">${json}</script>`;
}

/**
 * Returns the generated `<head>` tags of app/index.html (seo-geo §2–3, §8): title, description,
 * canonical, referrer policy, theme colour, llms.txt link, Open Graph, X card and JSON-LD.
 */
export function headTags(app: AppConfig): string {
  const title = escapeHtml(pageTitle(app));
  const description = escapeHtml(app.description);
  const alt = escapeHtml(ogImageAlt(app));
  const verification = app.seo.googleVerification;
  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<link rel="canonical" href="${app.url}" />`,
    `<meta name="referrer" content="strict-origin-when-cross-origin" />`,
    `<meta name="theme-color" content="${app.manifest.themeColor}" />`,
    `<link rel="describedby" type="text/plain" href="${app.url}llms.txt" title="Docs for AI agents (llms.txt)" />`,
    ...(verification ? [`<meta name="google-site-verification" content="${escapeHtml(verification)}" />`] : []),
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${escapeHtml(app.name)}" />`,
    `<meta property="og:locale" content="en_US" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${app.url}" />`,
    `<meta property="og:image" content="${ogImageUrl(app)}" />`,
    `<meta property="og:image:alt" content="${alt}" />`,
    `<meta property="og:image:width" content="${String(OG_IMAGE.width)}" />`,
    `<meta property="og:image:height" content="${String(OG_IMAGE.height)}" />`,
    `<meta property="og:image:type" content="${OG_IMAGE.type}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:image:alt" content="${alt}" />`,
    jsonLdScript(app),
  ].join("\n    ");
}

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

/**
 * Returns the per-app robots.txt — documentation only: crawlers read robots.txt at the host root
 * (the hub repo), never below it (seo-geo §6). Policy: all bots allowed (Moni 2026-11-05).
 */
export function robotsTxt(app: AppConfig): string {
  return [
    `# ${app.url}robots.txt — documentation only: crawlers ignore robots.txt below the host root.`,
    "# The live policy is https://simeontsvetanov.github.io/robots.txt (hub repo): every bot allowed,",
    "# search, AI answers and AI training included (Moni 2026-11-05). Named groups document intent and",
    "# keep a future \"*\" Disallow from silently applying to them (seo-geo §6–7).",
    "User-agent: *",
    "Allow: /",
    "",
    ...ROBOTS_GROUPS.flatMap((group) => [`# ${group.title}`, ...group.agents.map((agent) => `User-agent: ${agent}`), "Allow: /", ""]),
    `Sitemap: ${app.url}sitemap.xml`,
    "",
  ].join("\n");
}


/**
 * Returns llms.txt in the llmstxt.org format (seo-geo §8): H1 → `>` summary → plain paragraphs
 * (what it does, how, limits, privacy, FAQ answers) → `## Docs` and `## Optional` link lists only.
 */
export function llmsTxt(app: AppConfig): string {
  return [
    `# ${app.name}`,
    "",
    `> ${app.description}`,
    "",
    app.answer,
    "",
    `How to use ${app.name}: ${app.steps.join(" ")}`,
    "",
    ...app.faq.flatMap((item) => [`${item.q} ${item.a}`, ""]),
    `${app.name} has no API, no MCP server and no URL parameters: it runs only in the browser.`,
    "",
    "## Docs",
    `- [${app.name}](${app.url}): the app in the browser; installable, works offline after the first visit`,
    `- [Source code and README](${app.repo}): MIT licence`,
    "",
    "## Optional",
    `- [Changelog](${app.repo}/blob/main/CHANGELOG.md): user-visible changes by version`,
    `- [Privacy](${app.url}privacy/): what ${app.name} stores, where, and how to delete it`,
    `- [Terms](${app.url}terms/): conditions of use`,
    "",
  ].join("\n");
}
