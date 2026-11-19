import { describe, expect, it } from "vitest";
import { THEME_BACKGROUND, TEXT_COLOURS, themeColorMetas, tokenHex } from "./tokens.ts";

// PLAN T-12: theme-color, the manifest and og-image.png take their colours from design/tokens.css.
describe("tokenHex", () => {
  const css = [
    "    --color-bg: light-dark(oklch(97.1% 0.003 286.4), oklch(0% 0 0)); /* #F5F5F7 / #000000 */",
    "    --color-text-tertiary: light-dark(oklch(62.2% 0.007 286.2), oklch(62.2% 0.007 286.2)); /* #86868b: meta */",
    "    --color-accent: light-dark(oklch(56.3% 0.193 256.2), oklch(56.3% 0.193 256.2));",
  ].join("\n");

  it("reads the light / dark hex note of a token", () => {
    expect(tokenHex(css, "--color-bg")).toEqual({ light: "#F5F5F7", dark: "#000000" });
  });

  it("uses one hex for both themes and writes it in capitals", () => {
    expect(tokenHex(css, "--color-text-tertiary")).toEqual({ light: "#86868B", dark: "#86868B" });
  });

  it("fails on a missing token or a token without a hex note", () => {
    expect(() => tokenHex(css, "--color-surface")).toThrow(/has no --color-surface/);
    expect(() => tokenHex(css, "--color-accent")).toThrow(/no "\/\* #RRGGBB \*\/" note/);
  });

  it("does not take a longer token with the same start", () => {
    expect(() => tokenHex("  --color-bg-x: red; /* #111111 */", "--color-bg")).toThrow(/has no --color-bg/);
  });
});

describe("the colours read from design/tokens.css", () => {
  it("are the forge template's page background and text colours", () => {
    expect(THEME_BACKGROUND).toEqual({ light: "#F5F5F7", dark: "#000000" });
    expect(TEXT_COLOURS).toEqual({ text: { light: "#1D1D1F", dark: "#F5F5F7" }, secondary: { light: "#6E6E73", dark: "#A1A1A6" } });
  });

  it("give two theme-color metas, one per colour scheme", () => {
    expect(themeColorMetas()).toEqual([
      '<meta name="theme-color" media="(prefers-color-scheme: light)" content="#F5F5F7" />',
      '<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#000000" />',
    ]);
  });
});
