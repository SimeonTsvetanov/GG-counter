import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { app as config, type AppConfig } from "../app.config.ts";
import { POLICY_PAGES } from "../app/src/ui/legal-document.ts";
import { readLegalDocuments } from "./legal.ts";
import { appSitemapXml, latestReleaseDate, pageLastmod, sitemapXml } from "./sitemap.ts";

const app: AppConfig = config;
const withDate = (contentUpdated: string): AppConfig => ({ ...app, seo: { ...app.seo, contentUpdated } });

/** Returns the `lastmod` of every `<url>` of a sitemap, keyed by its `<loc>`. */
function lastmods(xml: string): Map<string, string> {
  return new Map([...xml.matchAll(/<url><loc>([^<]+)<\/loc><lastmod>([^<]+)<\/lastmod><\/url>/g)].map((match) => [match[1], match[2]] as const));
}

describe("latestReleaseDate and pageLastmod", () => {
  it("skips Unreleased and returns the newest dated release", () => {
    const changelog = "# Changelog\n\n## [Unreleased]\n- x\n\n## [1.2.0] - 2026-10-01\n- y\n\n## [1.1.0] - 2026-09-01\n- z\n";
    expect(latestReleaseDate(changelog)).toBe("2026-10-01");
    expect(latestReleaseDate("## [Unreleased]\n- First version.\n")).toBeUndefined();
  });

  it("takes the newer of the config date and the latest release — never today by default", () => {
    expect(pageLastmod(withDate("2026-11-19"), "## [Unreleased]\n")).toBe("2026-11-19");
    expect(pageLastmod(withDate("2026-11-19"), "## [1.0.0] - 2026-12-02\n")).toBe("2026-12-02");
    expect(pageLastmod(withDate("2026-11-19"), "## [0.9.0] - 2026-10-01\n")).toBe("2026-11-19");
  });
});

describe("sitemapXml", () => {
  it("lists the one canonical URL with its lastmod and nothing else", () => {
    const xml = sitemapXml(app, "2026-11-19");
    expect(xml).toContain(`<url><loc>${app.url}</loc><lastmod>2026-11-19</lastmod></url>`);
    expect(xml.match(/<url>/g)).toHaveLength(1);
    expect(xml).not.toMatch(/priority|changefreq|\?lang=/);
  });

  it("gives every page below the app URL its own lastmod, in order", () => {
    const xml = sitemapXml(app, "2026-11-19", [{ path: "terms/", lastmod: "2026-01-02" }, { path: "privacy/", lastmod: "2026-03-04" }]);
    expect([...lastmods(xml)]).toEqual([[app.url, "2026-11-19"], [`${app.url}terms/`, "2026-01-02"], [`${app.url}privacy/`, "2026-03-04"]]);
  });
});

describe("appSitemapXml (seo-geo §6: lastmod = the real last change of each page)", () => {
  it("dates the app URL by the latest release and each policy page by its own Last updated", () => {
    const changelog = "## [Unreleased]\n- next\n\n## [1.1.0] - 2026-12-20\n- y\n\n## [1.0.0] - 2026-11-19\n- x\n";
    const pages = [{ id: "terms", updated: "2026-11-19" }, { id: "privacy", updated: "2026-12-03" }];
    expect([...lastmods(appSitemapXml(withDate("2026-11-19"), changelog, pages))]).toEqual([
      [app.url, "2026-12-20"],
      [`${app.url}terms/`, "2026-11-19"],
      [`${app.url}privacy/`, "2026-12-03"],
    ]);
  });

  it("uses only dates from the sources — an unchanged page keeps its old date", () => {
    const pages = [{ id: "terms", updated: "2026-01-15" }];
    const xml = appSitemapXml(withDate("2026-02-01"), "## [1.0.0] - 2026-01-10\n", pages);
    expect(new Set(lastmods(xml).values())).toEqual(new Set(["2026-02-01", "2026-01-15"]));
  });

  it("for the real sources: CHANGELOG has a dated release and each policy page carries its own source date", () => {
    const changelog = readFileSync(new URL("../CHANGELOG.md", import.meta.url), "utf8");
    const docs = readLegalDocuments(app, new URL("../content/legal/", import.meta.url).pathname);
    const dates = lastmods(appSitemapXml(app, changelog, docs));
    expect(latestReleaseDate(changelog)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(dates.get(app.url)).toBe(pageLastmod(app, changelog));
    expect(dates.size).toBe(1 + POLICY_PAGES.length);
    for (const doc of docs) expect(dates.get(`${app.url}${doc.id}/`)).toBe(doc.updated);
  });
});
