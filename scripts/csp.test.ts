// Unit tests of the one Content-Security-Policy (scripts/csp.ts) and the pages that carry it:
// index.html (marker filled by app/vite.config.ts), 404.html and every policy page (security §1).
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { app as config, type AppConfig } from "../app.config.ts";
import { CONTENT_SECURITY_POLICY, cspMetaTag } from "./csp.ts";
import { policyPageHtml } from "./legal-page.ts";
import { readLegalDocuments } from "./legal.ts";
import { notFoundHtml } from "./static-page.ts";

const app: AppConfig = config;
const root = fileURLToPath(new URL("..", import.meta.url));
const legal = readLegalDocuments(app, join(root, "content", "legal"));

/** Returns the first element (or comment) inside `<head>`. */
function firstInHead(html: string): string | undefined {
  return /<head>\s*(<[^>]+>)/.exec(html)?.[1];
}

/** Returns the `content` of every meta CSP in `html`. */
function policiesOf(html: string): string[] {
  return [...html.matchAll(/<meta http-equiv="Content-Security-Policy" content="([^"]*)" \/>/g)].map((match) => match[1]);
}

describe("CONTENT_SECURITY_POLICY", () => {
  it("is the GitHub Pages policy of security §1: only our own files, nothing inline, no plugins", () => {
    expect(CONTENT_SECURITY_POLICY).toBe(
      "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'; worker-src 'self' blob:; manifest-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'",
    );
  });

  it("has no unsafe source, no WebAssembly and no header-only directive a meta tag would ignore", () => {
    expect(CONTENT_SECURITY_POLICY).not.toMatch(/unsafe-inline|unsafe-eval|wasm-unsafe-eval|\*|https?:/);
    expect(CONTENT_SECURITY_POLICY).not.toMatch(/frame-ancestors|report-uri|report-to|sandbox/);
  });

  it("names each directive once", () => {
    const names = CONTENT_SECURITY_POLICY.split("; ").map((directive) => directive.split(" ")[0]);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe("cspMetaTag on every page", () => {
  const pages = [
    { name: "404.html", html: notFoundHtml(app) },
    ...legal.map((doc) => ({ name: `${doc.id}/index.html`, html: policyPageHtml(app, doc) })),
  ];

  it("covers the five policy pages", () => {
    expect(legal.map((doc) => doc.id).sort()).toEqual(["ai-notice", "legal-notice", "privacy", "support", "terms"]);
  });

  it.each(pages)("$name has the one policy as the first element of <head>", ({ html }) => {
    expect(firstInHead(html)).toBe(cspMetaTag());
    expect(policiesOf(html)).toEqual([CONTENT_SECURITY_POLICY]);
  });

  it("app/index.html starts its <head> with the marker the Vite build fills with the same tag", () => {
    expect(firstInHead(readFileSync(join(root, "app", "index.html"), "utf8"))).toBe("<!--app-csp-->");
  });
});

describe("one source", () => {
  it("no other source file writes a Content-Security-Policy of its own", () => {
    const sources = [
      ...readdirSync(join(root, "scripts")).filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts")).map((file) => join(root, "scripts", file)),
      join(root, "app", "index.html"),
      join(root, "app", "vite.config.ts"),
    ];
    const writers = sources.filter((file) => readFileSync(file, "utf8").includes("http-equiv=\"Content-Security-Policy\""));
    expect(writers).toEqual([join(root, "scripts", "csp.ts")]);
  });
});
