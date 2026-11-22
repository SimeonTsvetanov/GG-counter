// ESLint 10 flat config — forge rules (engineering → typescript §4, code-quality §9, structure §1–2),
// adapted for a Level 2 (React) app: .tsx files and the React hooks rules.
// Every code-quality rule a tool can check lives here, so reviews focus on judgement calls.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import { UI_TEXT_SELECTORS } from "./scripts/ui-text-rule.ts";

/** Files whose tool requires `export default` (code-quality §2). */
const TOOL_CONFIG_FILES = ["**/*.config.{js,ts,mjs,mts}", "**/pw.*.config.ts"];
/** The mini-app contract loads these modules' default export (`MiniAppEntry.load` / `.help`, Quizzard PLAN §1.2). */
const CONTRACT_ENTRY_FILES = ["packages/miniapp/src/index.ts", "packages/miniapp/src/help.ts"];
/** Security §1: no HTML/code sinks (string timers: @typescript-eslint/no-implied-eval, in strict). */
const HTML_SINKS = [
  ...["innerHTML", "outerHTML", "insertAdjacentHTML", "srcdoc"].map((property) => ({ property, message: "HTML sink — use textContent or h() (engineering → security §1)." })),
  ...["write", "writeln"].map((property) => ({ object: "document", property, message: "HTML sink — use textContent or h() (engineering → security §1)." })),
];
/**
 * Browser storage is touched only by the storage modules (browser-storage §3): namespacing, migration,
 * failures — the game screen's packages/miniapp/src/storage and the page's app/src/storage.
 */
const STORAGE_APIS = ["localStorage", "sessionStorage", "indexedDB"];
const STORAGE_MESSAGE = "Use the storage module (packages/miniapp/src/storage, app/src/storage; engineering → browser-storage §3).";
/** Code that may not touch browser storage directly: everything of the page and the game screen but their storage modules. */
const STORAGE_RESTRICTED = { files: ["app/src/**", "packages/miniapp/src/**"], ignores: ["app/src/storage/**", "packages/miniapp/src/storage/**"] };
/** Modules: named exports only (code-quality §2); tool configs are exempt below. */
const NO_DEFAULT_EXPORT = { selector: "ExportDefaultDeclaration", message: "Use a named export (code-quality §2)." };
/** Tests read best as long `describe` blocks; size limits apply to source only. */
const TEST_FILES = ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "tests/**"];

export default tseslint.config(
  { ignores: ["**/*.d.ts", "**/dist/**", "**/.tsbuild/**", "app/public/**", "coverage/**", "playwright-report/**", "test-results/**"] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { project: ["./tsconfig.eslint.json"], tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      // Types and imports
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "as", objectLiteralTypeAssertions: "never" }],
      "@typescript-eslint/explicit-module-boundary-types": "error",
      // Modules: named exports only (tool configs are exempt below)
      "no-restricted-syntax": ["error", NO_DEFAULT_EXPORT],
      // Clarity
      eqeqeq: ["error", "always", { null: "ignore" }],
      curly: ["error", "multi-line"],
      "no-nested-ternary": "error",
      "prefer-template": "error",
      "max-depth": ["error", 3],
      "max-lines-per-function": ["error", { max: 60, skipBlankLines: true, skipComments: true }],
      "max-lines": ["error", { max: 300, skipBlankLines: true, skipComments: true }],
      "no-console": ["error", { allow: ["warn", "error"] }],
      // Security §1: no HTML/code sinks
      "no-eval": "error",
      "no-new-func": "error",
      "no-script-url": "error",
      "no-restricted-properties": ["error", ...HTML_SINKS],
      // Naming (code-quality §1); object keys stay free for i18n keys, headers and JSON shapes
      "@typescript-eslint/naming-convention": [
        "error",
        { selector: "default", format: ["camelCase"], leadingUnderscore: "allow" },
        { selector: "import", format: null },
        { selector: "variable", format: ["camelCase", "UPPER_CASE", "PascalCase"] },
        { selector: "function", format: ["camelCase", "PascalCase"] },
        { selector: "typeLike", format: ["PascalCase"] },
        { selector: "enumMember", format: ["PascalCase", "UPPER_CASE"] },
        { selector: ["objectLiteralProperty", "typeProperty", "objectLiteralMethod"], format: null },
      ],
    },
  },
  // React: hooks rules; components are PascalCase functions and may be longer than plain functions.
  { files: ["**/*.tsx"], plugins: { "react-hooks": reactHooks }, rules: { "react-hooks/rules-of-hooks": "error", "react-hooks/exhaustive-deps": "error", "max-lines-per-function": ["error", { max: 150, skipBlankLines: true, skipComments: true }] } },
  // PLAN T-09: no hard-coded UI text in the app's and the game screen's JSX — every string goes through t() (scripts/ui-text-rule.ts).
  { files: ["app/src/**/*.tsx", "packages/miniapp/src/**/*.tsx"], rules: { "no-restricted-syntax": ["error", NO_DEFAULT_EXPORT, ...UI_TEXT_SELECTORS] } },
  { files: [...TOOL_CONFIG_FILES, ...CONTRACT_ENTRY_FILES], rules: { "no-restricted-syntax": "off" } },
  { files: TEST_FILES, rules: { "max-lines-per-function": "off", "max-lines": "off" } },
  // Layers (engineering → structure §1–2): dependencies point one way, other packages by name only.
  { files: ["packages/core/src/**"], rules: { "no-restricted-imports": ["error", { patterns: [{ group: ["**/app/**", "**/mcp/**", "**/service/**", "*-mcp", "*-mcp/*"], message: "core imports nothing of ours (structure §1)." }] }], "no-restricted-globals": ["error", "document", "window", "localStorage", "sessionStorage", "indexedDB", "navigator", "fetch"] } },
  { files: ["packages/mcp/src/**"], rules: { "no-restricted-imports": ["error", { patterns: [{ group: ["**/app/**", "**/service/**", "**/packages/core/**"], message: "mcp imports core by its package name only (structure §1–2)." }] }] } },
  {
    ...STORAGE_RESTRICTED,
    rules: {
      "no-restricted-globals": ["error", ...STORAGE_APIS.map((name) => ({ name, message: STORAGE_MESSAGE }))],
      "no-restricted-properties": [
        "error",
        ...HTML_SINKS,
        ...["window", "globalThis", "self"].flatMap((object) => STORAGE_APIS.map((property) => ({ object, property, message: STORAGE_MESSAGE }))),
        { object: "navigator", property: "storage", message: STORAGE_MESSAGE },
      ],
    },
  },
  // The game screen (Quizzard PLAN GG-02) is its own layer: core by its package name, nothing of app/ or the
  // repo's app.config.ts (Quizzard bundles the package alone); app/ uses only the package's exports.
  { files: ["packages/miniapp/src/**", "packages/miniapp/*.ts"], rules: { "no-restricted-imports": ["error", { patterns: [{ group: ["**/app/**", "**/mcp/**", "**/service/**", "**/packages/**", "*-mcp", "*-mcp/*", "../../../*", "**/app.config*"], message: "the game screen imports core by its package name and nothing of app/ (structure §1–2)." }] }] } },
  // Mini-app e2e specs also run inside Quizzard from vendor/gg-counter (its PLAN T-13): no standalone config,
  // page or screen source (only the saved-game fixtures of core), and every navigation goes through
  // support/entry.ts (`#/scores`).
  { files: ["tests/e2e/miniapp/**"], rules: {
    "no-restricted-imports": ["error", { patterns: [{ group: ["**/app.config*", "**/app/**", "**/shell/**", "**/packages/*/src/**", "**/packages/miniapp/**", "gg-counter-*"], message: "mini-app specs import only @playwright/test, ../support and core's test fixtures (PLAN GG-03)." }] }],
    "no-restricted-syntax": ["error", NO_DEFAULT_EXPORT,
      { selector: "CallExpression[callee.property.name='goto']", message: "Open the screen with openApp() from ../support/entry.ts, so it also runs behind Quizzard's #/scores (PLAN GG-03)." }],
  } },
  { files: ["app/src/**"], rules: { "no-restricted-imports": ["error", { patterns: [{ group: ["**/packages/**", "**/service/**", "*-mcp", "*-mcp/*", "../../../*"], message: "app imports core and the game screen by their package names; no deep relative chains (structure §1–2)." }] }] } },
  { files: ["**/*.js", "**/*.mjs"], ...tseslint.configs.disableTypeChecked },
  { files: ["**/*.js", "**/*.mjs"], rules: { "@typescript-eslint/explicit-module-boundary-types": "off", "@typescript-eslint/naming-convention": "off" } },
  { files: ["scripts/**", "packages/mcp/**"], rules: { "no-console": "off" } },
);
