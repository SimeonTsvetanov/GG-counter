// The policy pages (app-shell → legal-pages §1) and the shape of one page after scripts/legal.ts has
// read its content/legal/<page>.md. The same data renders the in-app dialog (legal-dialog.tsx) and the
// standalone page (scripts/legal-page.ts), so both always show the same text. No imports: scripts load it too.

/** The policy pages, in menu order; each is `content/legal/<id>.md`, a dialog `#<id>` and the page `{base}<id>/`. */
export const POLICY_PAGES = ["terms", "privacy", "ai-notice", "legal-notice", "support"] as const;

/** One of {@link POLICY_PAGES}. */
export type PolicyPageId = (typeof POLICY_PAGES)[number];

/** A run of text inside a paragraph or list item. */
export type LegalInline =
  | { readonly kind: "text"; readonly text: string }
  | { readonly kind: "strong"; readonly text: string }
  | { readonly kind: "code"; readonly text: string }
  | { readonly kind: "link"; readonly text: string; readonly href: string }
  /** The contact email: a mailto link in the app, assembled by script on the standalone pages. */
  | { readonly kind: "email" };

/** One block of a policy page. */
export type LegalBlock =
  | { readonly kind: "heading"; readonly inlines: readonly LegalInline[] }
  | { readonly kind: "paragraph"; readonly inlines: readonly LegalInline[] }
  | { readonly kind: "list"; readonly isOrdered: boolean; readonly items: readonly (readonly LegalInline[])[] };

/** A policy page: its English title, the date its text last changed and its body. */
export interface LegalDocument {
  readonly id: PolicyPageId;
  /** English title from the source's first line, e.g. "Terms & Conditions". */
  readonly title: string;
  /** "Last updated" of the source as YYYY-MM-DD: the sitemap `lastmod` and the date shown. */
  readonly updated: string;
  readonly blocks: readonly LegalBlock[];
}

/** Returns true when `value` names a policy page. */
export function isPolicyPage(value: string): value is PolicyPageId {
  return (POLICY_PAGES as readonly string[]).includes(value);
}
