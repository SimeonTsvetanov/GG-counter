import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { formatDelta, formatEntryTime } from "../../src/players/history-format.ts";

// SPEC 1.1 F16: the "last changes" line and the history sheet show signed amounts and clock times.
describe("formatDelta", () => {
  it("adds + to gains and a true minus sign (U+2212) to losses", () => {
    expect(formatDelta(5)).toBe("+5");
    expect(formatDelta(-2)).toBe("−2");
    expect(formatDelta(999_999)).toBe("+999999");
    expect(formatDelta(-0.5)).toBe("−0.5");
  });

  it("property: never a hyphen; the digits are those of the amount", () => {
    fc.assert(fc.property(fc.integer({ min: -999_999, max: 999_999 }).filter((d) => d !== 0), (delta) => {
      const text = formatDelta(delta);
      expect(text).not.toContain("-");
      expect(text.slice(1)).toBe(String(Math.abs(delta)));
      expect(text.startsWith(delta > 0 ? "+" : "−")).toBe(true);
    }));
  });
});

describe("formatEntryTime", () => {
  // Local times, so the "same day" check does not depend on the machine's time zone.
  const now = new Date(2026, 10, 20, 21, 30);
  const today = new Date(2026, 10, 20, 19, 42).toISOString();
  const yesterday = new Date(2026, 10, 19, 19, 42).toISOString();
  // ICU versions differ in the space before "PM" (U+202F or U+0020); the words and digits are the point.
  const timeOf = (at: string, lang: string) => formatEntryTime(at, now, lang).replace(/\s/gu, " ");

  it("today: the clock time only, in the UI language", () => {
    expect(timeOf(today, "en")).toBe("7:42 PM");
    expect(timeOf(today, "bg")).toBe("19:42");
  });

  it("another day: the short date with the time", () => {
    expect(timeOf(yesterday, "en")).toBe("Nov 19, 7:42 PM");
    expect(timeOf(yesterday, "bg")).toBe("19.11, 19:42");
  });

  it("an unreadable time gives an empty text instead of “Invalid Date”", () => {
    expect(formatEntryTime("not a time", now, "en")).toBe("");
  });
});
