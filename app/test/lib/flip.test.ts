// FLIP offsets and the leaving-items merge behind the card and row motion (SPEC 1.2 F20), and the token parsers.
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { parseDuration, parsePixels } from "../../src/lib/css-tokens.ts";
import { flipOffsets, sameKeys, withLeaving, type Point } from "../../src/lib/flip.ts";

const at = (x: number, y: number): Point => ({ x, y });

describe("flipOffsets", () => {
  it("old − new for moved items; still, new and removed items are left out", () => {
    const before = new Map([["a", at(0, 0)], ["b", at(100, 0)], ["c", at(0, 160)], ["gone", at(100, 160)]]);
    const after = new Map([["a", at(0, 0)], ["b", at(0, 0.4)], ["c", at(100, 0)], ["new", at(0, 160)]]);
    expect([...flipOffsets(before, after)]).toEqual([["b", at(100, -0.4)], ["c", at(-100, 160)]]);
  });
  it("property: applying the offset to the new position gives the old one", () => {
    const point = fc.record({ x: fc.integer({ min: -2000, max: 2000 }), y: fc.integer({ min: -2000, max: 2000 }) });
    fc.assert(
      fc.property(fc.dictionary(fc.string(), fc.tuple(point, point)), (moves) => {
        const entries = Object.entries(moves);
        const offsets = flipOffsets(new Map(entries.map(([k, [from]]) => [k, from])), new Map(entries.map(([k, [, to]]) => [k, to])));
        for (const [key, [from, to]] of entries) {
          const offset = offsets.get(key);
          if (offset === undefined) expect(from).toEqual(to);
          else expect({ x: to.x + offset.x, y: to.y + offset.y }).toEqual(from);
        }
      }),
    );
  });
});

describe("sameKeys", () => {
  it("order and length matter", () => {
    expect(sameKeys(["a", "b"], ["a", "b"])).toBe(true);
    expect(sameKeys(["a", "b"], ["b", "a"])).toBe(false);
    expect(sameKeys(["a"], ["a", "b"])).toBe(false);
  });
});

describe("withLeaving", () => {
  it("puts leaving items back at their old index, clamped to the end", () => {
    expect(withLeaving(["a", "c"], [{ item: "b", index: 1 }])).toEqual(["a", "b", "c"]);
    expect(withLeaving(["a"], [{ item: "z", index: 5 }, { item: "x", index: 0 }])).toEqual(["x", "a", "z"]);
    expect(withLeaving([], [])).toEqual([]);
  });
  it("property: removing an item and putting it back as leaving gives the original order", () => {
    fc.assert(
      fc.property(fc.uniqueArray(fc.string(), { minLength: 1 }), fc.nat(), (list, seed) => {
        const index = seed % list.length;
        const rest = list.filter((_, i) => i !== index);
        expect(withLeaving(rest, [{ item: list[index] ?? "", index }])).toEqual(list);
      }),
    );
  });
});

describe("css tokens", () => {
  it("parseDuration reads ms and s; anything else is 0", () => {
    expect([parseDuration("250ms"), parseDuration(" 0.3s "), parseDuration("0ms"), parseDuration(""), parseDuration("fast"), parseDuration("-1s")]).toEqual([250, 300, 0, 0, 0, 0]);
  });
  it("parsePixels reads px, else the fallback", () => {
    expect([parsePixels("12px", 4), parsePixels(" 8px", 4), parsePixels("1rem", 4), parsePixels("", 4)]).toEqual([12, 8, 4, 4]);
  });
});
