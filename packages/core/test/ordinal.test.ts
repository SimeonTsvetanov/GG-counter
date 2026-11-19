// Example and property tests for the ordinals used in the share text (English and Bulgarian).
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { bulgarianOrdinal, ordinal } from "../src/index.ts";

describe("ordinal", () => {
  it.each([
    [1, "1st"], [2, "2nd"], [3, "3rd"], [4, "4th"], [10, "10th"],
    [11, "11th"], [12, "12th"], [13, "13th"], [21, "21st"], [22, "22nd"], [23, "23rd"],
    [101, "101st"], [111, "111th"], [112, "112th"], [113, "113th"],
  ])("%i → %s", (position, expected) => {
    expect(ordinal(position)).toBe(expected);
  });
});

describe("bulgarianOrdinal", () => {
  it.each([
    [1, "1-во"], [2, "2-ро"], [3, "3-то"], [4, "4-то"], [5, "5-то"], [6, "6-то"], [7, "7-мо"], [8, "8-мо"], [9, "9-то"], [10, "10-то"],
    [11, "11-то"], [12, "12-то"], [17, "17-то"], [18, "18-то"], [20, "20-то"], [21, "21-во"], [22, "22-ро"], [27, "27-мо"], [50, "50-то"],
    [100, "100-тно"], [101, "101-во"], [111, "111-то"], [200, "200-тно"], [1000, "1000-но"], [1100, "1100-тно"], [2000, "2000-но"],
  ])("%i → %s", (position, expected) => {
    expect(bulgarianOrdinal(position)).toBe(expected);
  });

  it("is the number, a hyphen and one of the Bulgarian endings for any place", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1_000_000 }), (position) => {
        expect(bulgarianOrdinal(position)).toMatch(new RegExp(`^${String(position)}-(во|ро|мо|то|тно|но)$`));
      }),
    );
  });
});
