// The start language (PLAN T-09, forge DECISIONS 2026-11-06): ?lang= → saved choice → English; no browser detection.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { pickLanguage } from "../../src/i18n/detect.ts";

describe("pickLanguage", () => {
  it("follows the order ?lang= → saved → English", () => {
    expect(pickLanguage({ search: "?lang=bg", saved: "en" })).toBe("bg");
    expect(pickLanguage({ search: "?x=1&lang=EN", saved: "bg" })).toBe("en");
    expect(pickLanguage({ search: "?lang=de", saved: "bg" })).toBe("bg");
    expect(pickLanguage({ search: "?lang=bg-BG", saved: null })).toBe("en");
    expect(pickLanguage({ search: "", saved: "bg" })).toBe("bg");
    expect(pickLanguage({ search: "", saved: null })).toBe("en");
  });

  it("property: never throws and always returns one of the app's languages", () => {
    fc.assert(
      fc.property(fc.string(), fc.constantFrom("en", "bg", null), (search, saved) => {
        expect(["en", "bg"]).toContain(pickLanguage({ search, saved }));
      }),
    );
  });
});
