import { describe, expect, it } from "vitest";
import { app as config, type AppConfig } from "../app.config.ts";
import { escapeHtml, headTags, llmsTxt, pageTitle, robotsTxt, structuredData } from "./seo.ts";

const app: AppConfig = config;

describe("escapeHtml", () => {
  it("escapes markup and double quotes", () => {
    expect(escapeHtml(`<a href="x">Tom & "Jerry"</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;Tom &amp; &quot;Jerry&quot;&lt;/a&gt;");
  });
});

describe("headTags", () => {
  const head = headTags(app);

  it("has one title, the description, the absolute self canonical and the llms.txt link", () => {
    expect(head.match(/<title>/g)).toHaveLength(1);
    expect(head).toContain(`<title>${pageTitle(app)}</title>`);
    expect(head).toContain(`<meta name="description" content="${app.description}" />`);
    expect(head).toContain(`<link rel="canonical" href="https://simeontsvetanov.github.io/GG-counter/" />`);
    expect(head).toContain(`<link rel="describedby" type="text/plain" href="${app.url}llms.txt"`);
    expect(head).toContain(`<meta name="referrer" content="strict-origin-when-cross-origin" />`);
    // PLAN T-12: one theme-color per colour scheme, = --color-bg of design/tokens.css (design-system §4).
    expect(head).toContain(`<meta name="theme-color" media="(prefers-color-scheme: light)" content="#F5F5F7" />`);
    expect(head).toContain(`<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#000000" />`);
  });

  it("has the complete Open Graph and X card tags with absolute URLs", () => {
    for (const property of ["og:title", "og:type", "og:url", "og:description", "og:site_name", "og:locale", "og:image", "og:image:alt", "og:image:width", "og:image:height", "og:image:type"]) {
      expect(head).toContain(`<meta property="${property}" content="`);
    }
    expect(head).toContain(`<meta property="og:image" content="${app.url}og-image.png" />`);
    expect(head).toContain(`<meta name="twitter:card" content="summary_large_image" />`);
    expect(head).toContain(`<meta name="twitter:image:alt" content="`);
  });

  it("never has noindex, keywords or hreflang; verification only when a token is set", () => {
    expect(head).not.toMatch(/noindex|name="keywords"|hreflang/);
    expect(head).not.toContain("google-site-verification");
    const verified: AppConfig = { ...app, seo: { ...app.seo, googleVerification: "abc\"123" } };
    expect(headTags(verified)).toContain(`<meta name="google-site-verification" content="abc&quot;123" />`);
  });

  it("escapes config text and keeps the JSON-LD block closed", () => {
    const tricky: AppConfig = { ...app, description: `A <b>"bold"</b> & </script> $& test` };
    const html = headTags(tricky);
    expect(html).toContain(`content="A &lt;b&gt;&quot;bold&quot;&lt;/b&gt; &amp; &lt;/script&gt; $&amp; test"`);
    expect(html.match(/<\/script>/g)).toHaveLength(1);
  });
});

describe("structuredData", () => {
  // because structuredData returns plain objects; the test reads their JSON shape
  const [webApplication, faqPage] = structuredData(app) as [Record<string, unknown>, { mainEntity: { name: string; acceptedAnswer: { text: string } }[] }];

  it("describes the app as free English entity data with no ratings", () => {
    expect(webApplication).toMatchObject({
      "@type": "WebApplication", name: "GG Counter", url: app.url, applicationCategory: "UtilitiesApplication",
      isAccessibleForFree: true, inLanguage: "en", image: `${app.url}og-image.png`, softwareVersion: app.version,
      offers: { price: "0" }, author: { "@type": "Person", sameAs: [app.author.github] }, featureList: [...app.features],
    });
    expect(webApplication).not.toHaveProperty("aggregateRating");
    expect(webApplication).not.toHaveProperty("review");
  });

  it("FAQPage questions and answers equal the visible FAQ", () => {
    expect(faqPage.mainEntity.map((q) => q.name)).toEqual(app.faq.map((f) => f.q));
    expect(faqPage.mainEntity.map((q) => q.acceptedAnswer.text)).toEqual(app.faq.map((f) => f.a));
  });
});

describe("robotsTxt", () => {
  it("says it is documentation only, allows every bot and points to the sitemap", () => {
    const robots = robotsTxt(app);
    expect(robots.split("\n")[0]).toMatch(/documentation only: crawlers ignore robots\.txt below the host root/);
    expect(robots).toContain("User-agent: *\nAllow: /");
    expect(robots).not.toMatch(/^Disallow/m);
    expect(robots).toContain(`Sitemap: ${app.url}sitemap.xml`);
  });
});

describe("llmsTxt", () => {
  const text = llmsTxt(app);
  const sections = text.split(/^## /m);

  it("follows the llmstxt.org order: H1, summary, paragraphs, then Docs and Optional", () => {
    expect(text.startsWith(`# ${app.name}\n\n> ${app.description}\n\n${app.answer}\n`)).toBe(true);
    expect(sections.slice(1).map((s) => s.split("\n")[0])).toEqual(["Docs", "Optional"]);
    for (const item of app.faq) expect(sections[0]).toContain(`${item.q} ${item.a}`);
  });

  it("has only `- [name](url): note` lines under H2 sections", () => {
    for (const section of sections.slice(1)) {
      const lines = section.split("\n").slice(1).filter((l) => l.trim());
      for (const line of lines) expect(line).toMatch(/^- \[[^\]]+\]\(https:\/\/[^)]+\)(: .+)?$/);
    }
  });
});
