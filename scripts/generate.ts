/**
 * Generates the search, agent and policy files from app.config.ts (app-shell §1). Run: `pnpm generate`
 * (also before dev, build and verify). Writes git-ignored files into app/public/: sitemap.xml,
 * llms.txt, robots.txt, 404.html, not-found.css, theme-init.js, sw-handover.js, the policy pages
 * `<page>/index.html` from content/legal/*.md with policy-page.css and year.js, and
 * third-party-licenses.txt (PLAN T-10); and the repo's LICENSE. The static <head> and page text of
 * app/index.html are filled at build time by app/vite.config.ts from the same functions.
 * Never hand-edit the outputs.
 */
import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { app, l10n, type AppConfig } from "../app.config.ts";
import { llmsTxt, pageLastmod, robotsTxt, sitemapXml } from "./seo.ts";
import { notFoundHtml } from "./static-page.ts";
import { configProblems } from "./config-check.ts";
import { themeInitScript } from "./theme-init.ts";
import { SW_HANDOVER_FILE, swHandoverScript } from "./sw-handover.ts";
import { readLegalDocuments } from "./legal.ts";
import { POLICY_PAGE_CSS, POLICY_PAGE_SCRIPT, policyPageHtml, yearScript } from "./legal-page.ts";
import { mitLicense, shippedPackages, thirdPartyLicensesTxt, withFallbackLicenseTexts } from "./licenses.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "app", "public");
const pageAssets = join(root, "scripts", "page-assets");
const config: AppConfig = app;
/** The year GG Counter was first published (the pre-forge LICENSE, PLAN T-02); LICENSE says "2025–<now>". */
const FIRST_PUBLISHED = 2025;

/** Reads a UTF-8 file relative to the repo root. */
function readText(path: string): string {
  return readFileSync(join(root, path), "utf8");
}

/** Writes one generated file into app/public/ (creating its folder). */
function writePublic(file: string, text: string): void {
  const path = join(publicDir, file);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
}

/**
 * Writes third-party-licenses.txt with the full licence of every shipped package (legal-pages §5).
 *
 * @throws {@link Error} when a package is not installed, has no licence file or a licence outside the allowlist.
 */
function writeThirdPartyLicenses(): void {
  const shipped = shippedPackages(join(root, "app"));
  const upstreamDir = join(pageAssets, "licenses");
  const upstreamTexts = new Map(
    readdirSync(upstreamDir).filter((file) => file.endsWith(".txt")).map((file) => [file.slice(0, -4), readFileSync(join(upstreamDir, file), "utf8").trim()] as const),
  );
  const packages = withFallbackLicenseTexts(shipped.packages, upstreamTexts);
  const problems = [
    ...shipped.missing.map((name) => `${name}: not installed — run pnpm i`),
    ...packages.filter((pkg) => pkg.licenseText === undefined).map((pkg) => `${pkg.name}: no licence file — add the upstream text to scripts/page-assets/licenses/`),
    ...shipped.disallowed.map((name) => `${name}: licence not allowed (app-shell rule 11)`),
  ];
  if (problems.length > 0) throw new Error(`third-party-licenses.txt:\n- ${problems.join("\n- ")}`);
  writePublic("third-party-licenses.txt", thirdPartyLicensesTxt(config.name, packages));
}

const packageVersion = (JSON.parse(readText("package.json")) as { version?: unknown }).version;
const problems = configProblems(config, { packageVersion, l10n });
if (problems.length > 0) {
  throw new Error(`app.config.ts is not valid:\n- ${problems.join("\n- ")}`);
}

const legal = readLegalDocuments(config, join(root, "content", "legal"));
const policyPages = legal.map((doc) => ({ path: `${doc.id}/`, lastmod: doc.updated }));
writePublic("sitemap.xml", sitemapXml(config, pageLastmod(config, readText("CHANGELOG.md")), policyPages));
writePublic("llms.txt", llmsTxt(config));
writePublic("robots.txt", robotsTxt(config));
writePublic("404.html", notFoundHtml(config));
copyFileSync(join(pageAssets, "not-found.css"), join(publicDir, "not-found.css"));
writePublic("theme-init.js", themeInitScript(config));
writePublic(SW_HANDOVER_FILE, swHandoverScript(config));
for (const doc of legal) writePublic(join(doc.id, "index.html"), policyPageHtml(config, doc));
copyFileSync(join(pageAssets, POLICY_PAGE_CSS), join(publicDir, POLICY_PAGE_CSS));
writePublic(POLICY_PAGE_SCRIPT, yearScript());
writeThirdPartyLicenses();
writeFileSync(join(root, "LICENSE"), mitLicense(readText("scripts/page-assets/LICENSE.mit"), FIRST_PUBLISHED));

console.log(`generate: done for ${config.id} (sitemap.xml, llms.txt, robots.txt, 404.html, theme-init.js, ${SW_HANDOVER_FILE}, ${String(legal.length)} policy pages, third-party-licenses.txt, LICENSE)`);
