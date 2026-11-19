// Reads CHANGELOG.md for the in-app "What's new" dialog (app-shell §5): the last versions with their
// user-facing lines. app/vite.config.ts runs it at build time and hands the result to the app.

/** How many versions What's new lists (app-shell §5: the last 3). */
export const WHATS_NEW_VERSIONS = 3;

/** One version of the changelog as What's new shows it. */
export interface ChangelogVersion {
  /** "1.2.0", or "Unreleased" for changes deployed before the next release number. */
  readonly version: string;
  /** Release date YYYY-MM-DD; null for "Unreleased". */
  readonly date: string | null;
  /** Plain-text lines for users (no Markdown marks). */
  readonly items: readonly string[];
}

/** True for a `### …` subsection that is not for users, e.g. "Changed (repository only)". */
function isRepositoryOnly(heading: string): boolean {
  return /repository only/i.test(heading);
}

/** Returns a Markdown list item as plain text: inline code and emphasis marks removed. */
function plainText(markdown: string): string {
  return markdown.replace(/[`*]/g, "").replace(/\s+/g, " ").trim();
}

/** Returns the user-facing list items of one version's body (the lines after its `## ` heading). */
function userItems(lines: readonly string[]): string[] {
  const items: string[] = [];
  let isUserSection = true;
  let current: string | null = null;
  const flush = (): void => {
    if (current !== null) items.push(plainText(current));
    current = null;
  };
  for (const line of lines) {
    if (line.startsWith("### ")) {
      flush();
      isUserSection = !isRepositoryOnly(line);
    } else if (line.startsWith("- ")) {
      flush();
      if (isUserSection) current = line.slice(2);
    } else if (current !== null && /^\s+\S/.test(line)) {
      current += ` ${line.trim()}`;
    } else {
      flush();
    }
  }
  flush();
  return items;
}

/**
 * Returns the newest {@link WHATS_NEW_VERSIONS} versions of a Keep a Changelog text that have at
 * least one user-facing line; sections marked "(repository only)" are left out.
 */
export function whatsNew(changelog: string): ChangelogVersion[] {
  return changelog
    .split(/^## /m)
    .slice(1)
    .map((block): ChangelogVersion => {
      const [heading = "", ...lines] = block.split("\n");
      const version = /\[([^\]]+)\]/.exec(heading)?.[1] ?? heading.trim();
      const date = /(\d{4}-\d{2}-\d{2})/.exec(heading)?.[1] ?? null;
      return { version, date, items: userItems(lines) };
    })
    .filter((version) => version.items.length > 0)
    .slice(0, WHATS_NEW_VERSIONS);
}
