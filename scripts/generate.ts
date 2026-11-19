/**
 * Generates the search and agent files from app.config.ts (app-shell §1). Run: `pnpm generate`
 * (also before dev, build and verify). Writes git-ignored files into app/public/: sitemap.xml,
 * llms.txt, robots.txt, 404.html, not-found.css, theme-init.js and sw-handover.js. The static <head> and page text of
 * app/index.html are filled at build time by app/vite.config.ts from the same functions.
 * Never hand-edit the outputs.
 */
import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { app, l10n, type AppConfig } from "../app.config.ts";
import { llmsTxt, pageLastmod, robotsTxt, sitemapXml } from "./seo.ts";
import { notFoundHtml } from "./static-page.ts";
import { configProblems } from "./config-check.ts";
import { themeInitScript } from "./theme-init.ts";
import { SW_HANDOVER_FILE, swHandoverScript } from "./sw-handover.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "app", "public");
const config: AppConfig = app;

/** Reads a UTF-8 file relative to the repo root. */
function readText(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

/** Writes one generated file into app/public/. */
function writePublic(file: string, text: string): void {
  writeFileSync(join(publicDir, file), text);
}

const packageVersion = (JSON.parse(readText("package.json")) as { version?: unknown }).version;
const problems = configProblems(config, { packageVersion, l10n });
if (problems.length > 0) {
  throw new Error(`app.config.ts is not valid:\n- ${problems.join("\n- ")}`);
}

writePublic("sitemap.xml", sitemapXml(config, pageLastmod(config, readText("CHANGELOG.md"))));
writePublic("llms.txt", llmsTxt(config));
writePublic("robots.txt", robotsTxt(config));
writePublic("404.html", notFoundHtml(config));
copyFileSync(join(root, "scripts", "page-assets", "not-found.css"), join(publicDir, "not-found.css"));
writePublic("theme-init.js", themeInitScript(config));
writePublic(SW_HANDOVER_FILE, swHandoverScript(config));

console.log(`generate: done for ${config.id} (sitemap.xml, llms.txt, robots.txt, 404.html, not-found.css, theme-init.js, ${SW_HANDOVER_FILE})`);
