import { describe, expect, it } from "vitest";
import { MAX_SCORE, MIN_SCORE } from "gg-counter-core";
import { MAX_LARGE_SCORE_LENGTH, isLongScore, isShortScore } from "../../src/players/score-size.ts";

// PLAN T-12: a 6-digit score overflowed its card at 390 px; every score within the limits keeps the large
// size on its own row, only longer saved scores (from before the limits) get the smaller one.
describe("isLongScore", () => {
  it("keeps every score within the limits at the large size", () => {
    expect(String(MIN_SCORE)).toHaveLength(MAX_LARGE_SCORE_LENGTH);
    for (const score of [0, 7, -120, 999_999, MAX_SCORE, MIN_SCORE]) expect(isLongScore(score), String(score)).toBe(false);
  });

  it("makes longer saved scores smaller", () => {
    for (const score of [MAX_SCORE * 100, MIN_SCORE * 10, 123_456_789_012]) expect(isLongScore(score), String(score)).toBe(true);
  });
});

// SPEC 1.1 F18: a compact card puts the score beside − and + only while it fits a 360 px phone.
describe("isShortScore", () => {
  it("up to three characters sit beside − and +", () => {
    for (const score of [0, 7, -9, 42, -99, 999]) expect(isShortScore(score), String(score)).toBe(true);
  });

  it("longer scores keep their own row", () => {
    for (const score of [1000, -100, 0.25, 12_345, MAX_SCORE, MIN_SCORE]) expect(isShortScore(score), String(score)).toBe(false);
  });
});
