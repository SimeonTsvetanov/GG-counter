import { describe, expect, it } from "vitest";
import { app as config, type AppConfig } from "../app.config.ts";
import { escapeHtml } from "./seo.ts";
import { noscriptHtml, notFoundHtml, pageInfoHtml } from "./static-page.ts";

const app: AppConfig = config;

describe("pageInfoHtml", () => {
  const html = pageInfoHtml(app);

  it("has one h1 with the name, marked static-only, then the answer sentence", () => {
    expect(html.match(/<h1\b/g)).toHaveLength(1);
    expect(html).toMatch(/<h1 data-static-only[^>]*>GG Counter<\/h1>\s*<p[^>]*>GG Counter is a free score tracker/);
  });

  it("lists every step and every FAQ item in a collapsed <details>", () => {
    for (const step of app.steps) expect(html).toContain(`<li>${escapeHtml(step)}</li>`);
    const summaries = [...html.matchAll(/<summary[^>]*>([^<]*)<\/summary>/g)].map((m) => m[1]);
    expect(summaries).toEqual(app.faq.map((item) => escapeHtml(item.q)));
    expect(html).not.toMatch(/<details[^>]* open/);
  });

  it("carries the markers the app's usePageInfo hook relies on", () => {
    expect(html).toMatch(/^<div data-page-info /);
    expect(html.match(/<section\b/g)).toHaveLength(1);
  });

  it("escapes config text", () => {
    const tricky: AppConfig = { ...app, answer: "GG Counter <script>x</script>", faq: [{ q: "A & B?", a: "<b>Yes</b>" }] };
    const escaped = pageInfoHtml(tricky);
    expect(escaped).toContain("GG Counter &lt;script&gt;x&lt;/script&gt;");
    expect(escaped).toContain("<summary class=\"cursor-pointer py-1 font-medium\">A &amp; B?</summary>");
    expect(escaped).not.toContain("<b>Yes</b>");
  });
});

describe("noscriptHtml", () => {
  it("says the tool needs JavaScript", () => {
    expect(noscriptHtml(app)).toMatch(/^<noscript>.*GG Counter needs JavaScript.*<\/noscript>$/);
  });
});

describe("notFoundHtml", () => {
  const html = notFoundHtml(app);

  it("is noindex, titled, and links back to the app with absolute asset URLs", () => {
    expect(html).toContain(`<meta name="robots" content="noindex" />`);
    expect(html).toContain("<title>Page not found · GG Counter</title>");
    expect(html).toContain(`<a class="not-found__button" href="/GG-counter/">Open GG Counter</a>`);
    for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) expect(url).toMatch(/^\/GG-counter\//);
  });

  it("has exactly one h1 and no scripts or inline styles", () => {
    expect(html.match(/<h1>/g)).toHaveLength(1);
    expect(html).not.toMatch(/<script|style="/);
  });
});
