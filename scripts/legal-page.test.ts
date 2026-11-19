// Unit tests of the standalone policy pages (scripts/legal-page.ts).
import { describe, expect, it } from "vitest";
import { app as config, type AppConfig } from "../app.config.ts";
import type { LegalDocument } from "../app/src/ui/legal-document.ts";
import { englishDate, policyPageHtml, yearScript } from "./legal-page.ts";

const app: AppConfig = config;

const doc: LegalDocument = {
  id: "privacy",
  title: "Privacy & <you>",
  updated: "2026-11-19",
  blocks: [
    { kind: "paragraph", inlines: [{ kind: "text", text: "Write to " }, { kind: "email" }, { kind: "text", text: " <now>." }] },
    { kind: "heading", inlines: [{ kind: "text", text: "When data reaches us" }] },
    { kind: "list", isOrdered: true, items: [[{ kind: "strong", text: "One" }], [{ kind: "link", text: "Terms", href: "/GG-counter/terms/" }, { kind: "code", text: "a<b" }]] },
  ],
};

describe("policyPageHtml", () => {
  const html = policyPageHtml(app, doc);

  it("is an English page with a strict meta CSP, its own canonical and no inline script or style", () => {
    expect(html).toMatch(/^<!doctype html>\n<html lang="en">/);
    expect(html).toContain(`<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self';`);
    expect(html).toContain(`<link rel="canonical" href="${app.url}privacy/" />`);
    expect(html).toContain(`<script src="${app.basePath}theme-init.js"></script>`);
    expect(html).not.toMatch(/<script>|<style|style="/);
  });

  it("has one h1, the date line and the blocks, escaped", () => {
    expect(html.match(/<h1>/g)).toHaveLength(1);
    expect(html).toContain("<h1>Privacy &amp; &lt;you&gt;</h1>");
    expect(html).toContain("<title>Privacy &amp; &lt;you&gt; · GG Counter</title>");
    expect(html).toContain('<p class="policy-updated">Last updated: 19 November 2026</p>');
    expect(html).toContain("<h2>When data reaches us</h2>");
    expect(html).toMatch(/<ol>\s*<li><strong>One<\/strong><\/li>\s*<li><a href="\/GG-counter\/terms\/">Terms<\/a><code>a&lt;b<\/code><\/li>\s*<\/ol>/);
    expect(html).toContain(" &lt;now&gt;.");
  });

  it("never writes the email as plain text: year.js assembles it from data attributes", () => {
    expect(html).not.toContain(app.contact.email);
    expect(html).toContain('<a data-email-user="tsvetanov.simeon" data-email-domain="gmail.com">email (needs JavaScript)</a>');
  });

  it("has the app footer's links in the same order, the © with a build-time year and the way back", () => {
    const nav = /<nav class="policy-nav"[^>]*>(.*)<\/nav>/.exec(html)?.[1] ?? "";
    const labels = [...nav.matchAll(/>([^<]+)<\/a>/g)].map((match) => match[1]);
    expect(labels).toEqual(["Terms", "Privacy", "AI notice", "Legal notice", "Contact", "Support me ☕"]);
    expect(nav).toContain(`<a href="${app.basePath}support/">Contact</a>`);
    expect(html).toContain(`© <span data-year>${String(new Date().getFullYear())}</span> Simeon Tsvetanov · <a href="${app.basePath}">Back to GG Counter</a>`);
  });
});

describe("englishDate", () => {
  it("writes the date like the sources, whatever the machine's time zone", () => {
    expect(englishDate("2026-11-19")).toBe("19 November 2026");
    expect(englishDate("2027-01-01")).toBe("1 January 2027");
  });
});

describe("yearScript", () => {
  it("is plain ES5 for the CSP-safe external file: no imports, no arrow functions", () => {
    const script = yearScript();
    expect(script).toContain("[data-year]");
    expect(script).toContain('"mailto:" + email');
    expect(script).not.toMatch(/=>|\bimport\b|\blet\b|\bconst\b/);
  });
});
