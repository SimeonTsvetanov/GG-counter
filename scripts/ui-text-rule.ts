/**
 * The lint rule against hard-coded UI text in JSX (PLAN T-09, app-shell → i18n §2): `no-restricted-syntax`
 * selectors used by eslint.config.js for app/src/**\/*.tsx. Core ESLint only — no plugin to install or
 * keep compatible with ESLint 10. A "text" is anything with a letter in any script (\p{L}), so emoji,
 * digits and separators such as " · " stay allowed; t("key") calls are fine because their string is
 * a call argument, not JSX text or an attribute value.
 */

/** One `no-restricted-syntax` entry. */
export interface RestrictedSyntax {
  readonly selector: string;
  readonly message: string;
}

/** Attributes whose value people read or hear. */
const READ_ATTRIBUTES = "/^(alt|aria-description|aria-label|aria-placeholder|aria-roledescription|aria-valuetext|label|placeholder|title)$/";
const HAS_LETTER = "/\\p{L}/u";
const MESSAGE = "UI text goes through t(): add a key to app/src/i18n/en.ts and bg.ts (app-shell → i18n §2).";

/** The places a literal can sit in a value: as it is, in {…}, in a template, or in a ?: / && branch. */
const VALUE_FORMS = [
  `> Literal[value=${HAS_LETTER}]`,
  `> JSXExpressionContainer > Literal[value=${HAS_LETTER}]`,
  `> JSXExpressionContainer > TemplateLiteral > TemplateElement[value.raw=${HAS_LETTER}]`,
  `> JSXExpressionContainer > :matches(ConditionalExpression, LogicalExpression) > Literal[value=${HAS_LETTER}]`,
];

/** The selectors: text between tags, `{"…"}` children and read attributes with a literal value. */
export const UI_TEXT_SELECTORS: readonly RestrictedSyntax[] = [
  { selector: `JSXText[value=${HAS_LETTER}]`, message: MESSAGE },
  ...VALUE_FORMS.slice(1).map((form) => ({ selector: `:matches(JSXElement, JSXFragment) ${form}`, message: MESSAGE })),
  ...VALUE_FORMS.map((form) => ({ selector: `JSXAttribute[name.name=${READ_ATTRIBUTES}] ${form}`, message: MESSAGE })),
];
