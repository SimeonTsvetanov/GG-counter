// ESLint 10 flat config — forge rules (engineering → typescript §4, code-quality §9, structure §1–2),
// adapted for a Level 2 (React) app: .tsx files and the React hooks rules.
// Every code-quality rule a tool can check lives here, so reviews focus on judgement calls.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";

/** Files whose tool requires `export default` (code-quality §2). */
const TOOL_CONFIG_FILES = ["**/*.config.{js,ts,mjs,mts}", "**/pw.*.config.ts"];
/** Security §1: no HTML/code sinks (string timers: @typescript-eslint/no-implied-eval, in strict). */
const HTML_SINKS = [
  ...["innerHTML", "outerHTML", "insertAdjacentHTML", "srcdoc"].map((property) => ({ property, message: "HTML sink — use textContent or h() (engineering → security §1)." })),
  ...["write", "writeln"].map((property) => ({ object: "document", property, message: "HTML sink — use textContent or h() (engineering → security §1)." })),
];
/** Browser storage is touched only by app/src/storage (browser-storage §3): namespacing, migration, failures. */
const STORAGE_APIS = ["localStorage", "sessionStorage", "indexedDB"];
const STORAGE_MESSAGE = "Use the storage module in app/src/storage (engineering → browser-storage §3).";
/** Tests read best as long `describe` blocks; size limits apply to source only. */
const TEST_FILES = ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "tests/**"];

export default tseslint.config(
  { ignores: ["**/*.d.ts", "**/dist/**", "app/postcss.config.cjs", "**/.tsbuild/**", "app/public/**", "coverage/**", "playwright-report/**", "test-results/**"] },
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
      "no-restricted-syntax": ["error", { selector: "ExportDefaultDeclaration", message: "Use a named export (code-quality §2)." }],
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
  { files: TOOL_CONFIG_FILES, rules: { "no-restricted-syntax": "off" } },
  { files: TEST_FILES, rules: { "max-lines-per-function": "off", "max-lines": "off" } },
  // Layers (engineering → structure §1–2): dependencies point one way, other packages by name only.
  { files: ["packages/core/src/**"], rules: { "no-restricted-imports": ["error", { patterns: [{ group: ["**/app/**", "**/mcp/**", "**/service/**", "*-mcp", "*-mcp/*"], message: "core imports nothing of ours (structure §1)." }] }], "no-restricted-globals": ["error", "document", "window", "localStorage", "sessionStorage", "indexedDB", "navigator", "fetch"] } },
  { files: ["packages/mcp/src/**"], rules: { "no-restricted-imports": ["error", { patterns: [{ group: ["**/app/**", "**/service/**", "**/packages/core/**"], message: "mcp imports core by its package name only (structure §1–2)." }] }] } },
  {
    files: ["app/src/**"],
    ignores: ["app/src/storage/**"],
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
  { files: ["app/src/**"], rules: { "no-restricted-imports": ["error", { patterns: [{ group: ["**/packages/**", "**/service/**", "*-mcp", "*-mcp/*", "../../../*"], message: "app imports core by its package name; no deep relative chains (structure §1–2)." }] }] } },
  { files: ["**/*.js", "**/*.mjs"], ...tseslint.configs.disableTypeChecked },
  { files: ["**/*.js", "**/*.mjs"], rules: { "@typescript-eslint/explicit-module-boundary-types": "off", "@typescript-eslint/naming-convention": "off" } },
  { files: ["scripts/**", "packages/mcp/**"], rules: { "no-console": "off" } },
);
