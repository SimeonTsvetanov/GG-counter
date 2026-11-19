// t() for the UI texts in en.ts: typed dotted keys and `{{name}}` placeholders, the same call shape as
// i18next so PLAN T-09 can swap the implementation and add Bulgarian without touching components.
import { en } from "./en";

/** Deep `string` version of the English dictionary — the type every other language must satisfy. */
export type Messages = Widen<typeof en>;

type Widen<T> = { readonly [K in keyof T]: T[K] extends string ? string : Widen<T[K]> };

/** Every dotted path to a text in the dictionary, e.g. `"shell.menu.open"`. */
export type MessageKey = Leaves<typeof en>;

type Leaves<T, Prefix extends string = ""> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Leaves<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

/** Values for the `{{name}}` placeholders of a text. */
export type MessageValues = Readonly<Record<string, string | number>>;

const PLACEHOLDER = /\{\{(\w+)\}\}/g;

/** Returns the dictionary entry at `key`, or undefined when the path does not end at a text. */
function lookup(messages: Messages, key: string): string | undefined {
  let node: unknown = messages;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : undefined;
}

/**
 * Returns the English text for `key` with its `{{placeholders}}` filled from `values`.
 *
 * @remarks Numbers are written as given (callers format them, e.g. with `formatNumber`). A
 * placeholder without a value stays visible as `{{name}}` so a missing value is noticed in tests.
 */
export function t(key: MessageKey, values: MessageValues = {}): string {
  const text = lookup(en, key);
  // because MessageKey only allows paths to texts; reaching this is a bug in the dictionary type
  if (text === undefined) throw new Error(`Missing UI text: ${key}`);
  return text.replace(PLACEHOLDER, (placeholder, name: string) => (Object.hasOwn(values, name) ? String(values[name]) : placeholder));
}

/** Returns `value` with the UI language's digit grouping (e.g. 999,999). */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en").format(value);
}
