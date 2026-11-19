// The JSX UI-text rule (PLAN T-09) catches literal text and read attributes, and lets t() calls,
// emoji, numbers and separators through.
import { Linter } from "eslint";
import tseslint from "typescript-eslint";
import { describe, expect, it } from "vitest";
import { UI_TEXT_SELECTORS } from "./ui-text-rule.ts";

const linter = new Linter({ configType: "flat" });
const config: Linter.Config[] = [
  {
    files: ["**/*.tsx"],
    languageOptions: { parser: tseslint.parser, parserOptions: { ecmaFeatures: { jsx: true } } },
    rules: { "no-restricted-syntax": ["error", ...UI_TEXT_SELECTORS] },
  },
];

/** Returns how many UI-text problems the rule reports in `jsx`. */
function problems(jsx: string): number {
  return linter.verify(`const view = (ok: boolean) => ${jsx};`, config, "view.tsx").filter((message) => message.ruleId === "no-restricted-syntax").length;
}

describe("UI text rule", () => {
  it.each([
    ["text between tags", "<p>Hello</p>"],
    ["Cyrillic text", "<p>Здравей</p>"],
    ["a string child", '<p>{"Hello"}</p>'],
    ["a template child", "<p>{`Hi ${String(ok)}`}</p>"],
    ["a conditional child", '<p>{ok ? "Yes" : null}</p>'],
    ["a fragment child", '<>{"Hello"}</>'],
    ["aria-label", '<button aria-label="Close" />'],
    ["aria-label in braces", '<button aria-label={"Close"} />'],
    ["placeholder", '<input placeholder="Name" />'],
    ["title from a branch", '<abbr title={ok ? "Yes" : "No"} />'],
    ["alt", '<img alt="Logo" />'],
  ])("reports %s", (_name, jsx) => {
    expect(problems(jsx)).toBeGreaterThan(0);
  });

  it.each([
    ["t() everywhere", '<button aria-label={t("shell.close")} title={t("shell.close")}>{t("shell.close")}</button>'],
    ["emoji, numbers and separators", '<p>🥇 {" · "} 42 ! —</p>'],
    ["class names and ids", '<div className="flex gap-2" id="settings-theme" data-action="help" />'],
    ["a non-read attribute", '<input type="radio" name="lang" value="bg" lang="bg" />'],
    ["values and names", "<p>{player.name} {player.score}</p>"],
  ])("allows %s", (_name, jsx) => {
    expect(problems(jsx)).toBe(0);
  });
});
