// The scroll decision that keeps a focused field and its button on screen above the keyboard (SPEC 1.2 F19).
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { REVEAL_MARGIN, revealOffset, visibleSpan } from "../../src/lib/reveal.ts";

describe("visibleSpan", () => {
  it("visual viewport below the header: from the header's bottom to the keyboard's top", () => {
    expect(visibleSpan({ height: 504, offsetTop: 0, scale: 1 }, 844, 52)).toEqual({ top: 52, bottom: 504 });
  });
  it("iOS scrolled the visual viewport down: its own top wins over the header", () => {
    expect(visibleSpan({ height: 400, offsetTop: 120, scale: 1 }, 844, 52)).toEqual({ top: 120, bottom: 520 });
  });
  it("pinch-zoomed → still the part the user sees (a slight zoom must not switch the reveal off)", () => {
    expect(visibleSpan({ height: 480, offsetTop: 30, scale: 1.05 }, 844, 52)).toEqual({ top: 52, bottom: 510 });
    expect(visibleSpan({ height: 300, offsetTop: 100, scale: 2 }, 844, 52)).toEqual({ top: 100, bottom: 400 });
  });
  it("no VisualViewport → the layout viewport below the header", () => {
    expect(visibleSpan(null, 800, 52)).toEqual({ top: 52, bottom: 800 });
  });
});

describe("revealOffset", () => {
  const visible = { top: 52, bottom: 504 };
  it("inside → 0", () => { expect(revealOffset({ top: 200, bottom: 300 }, visible)).toBe(0); });
  it("under the keyboard → scroll down just enough", () => {
    expect(revealOffset({ top: 480, bottom: 580 }, visible)).toBe(580 - (504 - REVEAL_MARGIN));
  });
  it("under the header → scroll up just enough", () => {
    expect(revealOffset({ top: 20, bottom: 120 }, visible)).toBe(20 - (52 + REVEAL_MARGIN));
  });
  it("taller than the room → its top below the header", () => {
    expect(revealOffset({ top: 400, bottom: 1000 }, visible)).toBe(400 - (52 + REVEAL_MARGIN));
  });

  it("property: after scrolling by the offset a target that fits is inside; 0 exactly when it already was", () => {
    const span = fc.tuple(fc.integer({ min: -2000, max: 2000 }), fc.integer({ min: 0, max: 600 })).map(([top, height]) => ({ top, bottom: top + height }));
    const room = fc.tuple(fc.integer({ min: 0, max: 200 }), fc.integer({ min: 100, max: 900 })).map(([top, height]) => ({ top, bottom: top + height }));
    fc.assert(
      fc.property(span, room, (target, view) => {
        const offset = revealOffset(target, view);
        const moved = { top: target.top - offset, bottom: target.bottom - offset };
        const fits = target.bottom - target.top <= view.bottom - view.top - 2 * REVEAL_MARGIN;
        const inside = (s: { top: number; bottom: number }) => s.top >= view.top + REVEAL_MARGIN && s.bottom <= view.bottom - REVEAL_MARGIN;
        if (fits) expect(inside(moved)).toBe(true);
        else expect(moved.top).toBe(view.top + REVEAL_MARGIN);
        if (fits) expect(offset === 0).toBe(inside(target));
      }),
    );
  });
});
