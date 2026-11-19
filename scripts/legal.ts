/**
 * Reads the policy sources content/legal/<page>.md (app-shell → legal-pages §1) into LegalDocument data:
 * placeholders filled from app.config.ts, template comments dropped, a small Markdown subset parsed
 * (paragraphs, `-` and `1.` lists, `##` headings, **strong**, `code`, [links](…)). Used by
 * scripts/generate.ts (standalone pages, sitemap) and app/vite.config.ts (the in-app dialogs).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { AppConfig } from "../app.config.ts";
import { POLICY_PAGES, type LegalBlock, type LegalDocument, type LegalInline, type PolicyPageId } from "../app/src/ui/legal-document.ts";

/** Any `{placeholder}` left after filling, except `{email}`: each renderer writes the email its own way. */
const UNFILLED = /\{(?!email\})[^}\n]{1,60}\}/;
const HEADER = /^\*\*(.+?)\*\* — Last updated: (\d{1,2}) ([A-Z][a-z]+) (\d{4})$/;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const INLINE = /\*\*.+?\*\*|`[^`]+`|\[[^\]]+\]\([^)\s]+\)|\{email\}/g;
/** Links may only go to our own pages, https sites or an email app (no javascript: or data: URLs). */
const SAFE_HREF = /^(https:\/\/|mailto:|\/)/;

/**
 * Returns the values of the `{placeholder}`s in content/legal/*.md, all from app.config.ts (one fact,
 * one place); `{email}` is not among them. Only the forge template's placeholders: compliance-check
 * treats any other `{…}` in the sources as unfilled.
 */
export function legalPlaceholders(app: AppConfig): Readonly<Record<string, string>> {
  return {
    "{App}": app.name,
    "{country}": app.author.country,
    "{linkedin}": app.author.linkedin,
    "{repo}": app.repo,
    "{base}": app.basePath,
  };
}

/** Returns the ISO date (YYYY-MM-DD) of "19 November 2026", or undefined for anything else. */
export function isoDate(day: string, month: string, year: string): string | undefined {
  const monthIndex = MONTHS.indexOf(month);
  const dayNumber = Number(day);
  if (monthIndex < 0 || dayNumber < 1 || dayNumber > 31) return undefined;
  return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(dayNumber).padStart(2, "0")}`;
}

/** Returns the run of one {@link INLINE} match (`whole` = the matched text). */
function inlineOf(whole: string): LegalInline {
  if (whole.startsWith("**")) return { kind: "strong", text: whole.slice(2, -2) };
  if (whole.startsWith("`")) return { kind: "code", text: whole.slice(1, -1) };
  if (whole === "{email}") return { kind: "email" };
  const split = whole.indexOf("](");
  return { kind: "link", text: whole.slice(1, split), href: safeHref(whole.slice(split + 2, -1)) };
}

/** Returns the runs of `text`: plain text, **strong**, `code`, [links](href) and the email. */
export function parseInlines(text: string): LegalInline[] {
  const inlines: LegalInline[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    if (match.index > last) inlines.push({ kind: "text", text: text.slice(last, match.index) });
    inlines.push(inlineOf(match[0]));
    last = match.index + match[0].length;
  }
  if (last < text.length) inlines.push({ kind: "text", text: text.slice(last) });
  return inlines;
}

/**
 * Returns `href` when it is safe to put into a page.
 *
 * @throws {@link Error} for any other scheme — the sources are ours, so this is a mistake in them.
 */
function safeHref(href: string): string {
  if (!SAFE_HREF.test(href)) throw new Error(`content/legal: link "${href}" must start with https://, mailto: or /`);
  return href;
}

/** Returns the items of a list chunk: each starts at a `marker` line; indented lines continue it. */
function listItems(lines: readonly string[], marker: RegExp): LegalInline[][] {
  const items: string[] = [];
  for (const line of lines) {
    if (marker.test(line)) items.push(line.replace(marker, ""));
    else items[items.length - 1] = `${items.at(-1) ?? ""} ${line.trim()}`;
  }
  return items.map(parseInlines);
}

/** Returns the block of one chunk of Markdown (text between blank lines). */
export function parseBlock(chunk: string): LegalBlock {
  const lines = chunk.split("\n");
  const first = lines[0] ?? "";
  if (first.startsWith("## ")) return { kind: "heading", inlines: parseInlines(first.slice(3).trim()) };
  if (first.startsWith("- ")) return { kind: "list", isOrdered: false, items: listItems(lines, /^- /) };
  if (/^\d+\. /.test(first)) return { kind: "list", isOrdered: true, items: listItems(lines, /^\d+\. /) };
  return { kind: "paragraph", inlines: parseInlines(lines.map((line) => line.trim()).join(" ")) };
}

/** Returns `source` with the template comments removed and the placeholders filled in. */
function fillSource(source: string, values: Readonly<Record<string, string>>): string {
  let text = source.replace(/<!--[\s\S]*?-->/g, "");
  for (const [placeholder, value] of Object.entries(values)) text = text.replaceAll(placeholder, value);
  return text;
}

/**
 * Returns the policy page `id` read from its Markdown `source`.
 *
 * @param values - placeholder values ({@link legalPlaceholders}).
 * @throws {@link Error} when a placeholder is left (none may ship, legal-pages §1), the first line is
 * not "**Title** — Last updated: D Month YYYY", or a link is unsafe — `pnpm generate` stops then.
 */
export function parseLegalDocument(id: PolicyPageId, source: string, values: Readonly<Record<string, string>>): LegalDocument {
  const text = fillSource(source, values);
  const unfilled = UNFILLED.exec(text);
  if (unfilled) throw new Error(`content/legal/${id}.md: placeholder ${unfilled[0]} has no value in app.config.ts`);
  const [first = "", ...chunks] = text.split(/\n\s*\n/).map((chunk) => chunk.trim()).filter(Boolean);
  const header = HEADER.exec(first);
  const updated = header === null ? undefined : isoDate(header[2], header[3], header[4]);
  if (header === null || updated === undefined) throw new Error(`content/legal/${id}.md: the first line must be "**Title** — Last updated: 19 November 2026"`);
  return { id, title: header[1], updated, blocks: chunks.map(parseBlock) };
}

/** Reads and parses every policy page from `legalDir` (content/legal), in {@link POLICY_PAGES} order. */
export function readLegalDocuments(app: AppConfig, legalDir: string): LegalDocument[] {
  const values = legalPlaceholders(app);
  return POLICY_PAGES.map((id) => parseLegalDocument(id, readFileSync(join(legalDir, `${id}.md`), "utf8"), values));
}
