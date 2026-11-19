// Example tests for the English ordinal used in the share text.
import { describe, expect, it } from "vitest";
import { ordinal } from "../src/index.ts";

describe("ordinal", () => {
  it.each([
    [1, "1st"], [2, "2nd"], [3, "3rd"], [4, "4th"], [10, "10th"],
    [11, "11th"], [12, "12th"], [13, "13th"], [21, "21st"], [22, "22nd"], [23, "23rd"],
    [101, "101st"], [111, "111th"], [112, "112th"], [113, "113th"],
  ])("%i → %s", (position, expected) => {
    expect(ordinal(position)).toBe(expected);
  });
});
