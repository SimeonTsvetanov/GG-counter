import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { WHATS_NEW_VERSIONS, whatsNew } from "./changelog.ts";

const SAMPLE = `# Changelog

Intro text.

## [Unreleased]
The app is being migrated.

### Added
- Help in the menu: how to use it
  and the FAQ.
- \`Export\` of **your** data.

### Changed (repository only)
- Lint rules.

## [1.1.0] - 2026-10-01
### Fixed
- A score bug.

## [1.0.0] - 2026-09-01
### Changed (repository only)
- CI only.

## [0.9.0] - 2026-08-01
- Old line.

## [0.8.0] - 2026-07-01
- Older line.
`;

describe("whatsNew", () => {
  it("keeps user-facing items only, joins wrapped lines and drops Markdown marks", () => {
    expect(whatsNew(SAMPLE)[0]).toEqual({
      version: "Unreleased",
      date: null,
      items: ["Help in the menu: how to use it and the FAQ.", "Export of your data."],
    });
  });

  it("returns the last versions that have user-facing items, newest first, with their dates", () => {
    const versions = whatsNew(SAMPLE);
    expect(versions).toHaveLength(WHATS_NEW_VERSIONS);
    expect(versions.map((v) => [v.version, v.date])).toEqual([["Unreleased", null], ["1.1.0", "2026-10-01"], ["0.9.0", "2026-08-01"]]);
  });

  it("an empty or heading-only changelog gives no versions", () => {
    expect(whatsNew("")).toEqual([]);
    expect(whatsNew("# Changelog\n\n## [Unreleased]\n")).toEqual([]);
  });

  it("reads the repository's CHANGELOG.md", () => {
    const versions = whatsNew(readFileSync(new URL("../CHANGELOG.md", import.meta.url), "utf8"));
    expect(versions.length).toBeGreaterThan(0);
    for (const version of versions) {
      expect(version.items.length).toBeGreaterThan(0);
      for (const item of version.items) expect(item).not.toMatch(/[`*]|\n/);
    }
  });
});
