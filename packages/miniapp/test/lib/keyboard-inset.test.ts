// Unit tests of the on-screen-keyboard inset (src/lib/keyboard-inset.ts): the part of the layout
// viewport the keyboard covers, from a fake VisualViewport, and the custom properties it keeps current.
import { describe, expect, it } from "vitest";
import { keyboardInset, trackKeyboardInset } from "../../src/lib/keyboard-inset.ts";

describe("keyboardInset", () => {
  it("is 0 while the visual viewport fills the layout viewport", () => {
    expect(keyboardInset(800, { height: 800, offsetTop: 0, scale: 1 })).toBe(0);
  });

  it("is the covered height when the keyboard only shrinks the visual viewport (iOS Safari)", () => {
    expect(keyboardInset(800, { height: 460, offsetTop: 0, scale: 1 })).toBe(340);
  });

  it("subtracts how far the browser scrolled the visual viewport to show the field", () => {
    expect(keyboardInset(800, { height: 460, offsetTop: 120, scale: 1 })).toBe(220);
  });

  it("is 0 when the layout viewport itself was resized (interactive-widget=resizes-content)", () => {
    expect(keyboardInset(460, { height: 460, offsetTop: 0, scale: 1 })).toBe(0);
  });

  it("ignores pinch zoom and sub-pixel noise", () => {
    expect(keyboardInset(800, { height: 400, offsetTop: 0, scale: 2 })).toBe(0);
    expect(keyboardInset(800, { height: 799.6, offsetTop: 0, scale: 1 })).toBe(0);
  });
});

describe("trackKeyboardInset", () => {
  it("writes --keyboard-inset and --visual-height now and on every viewport change, until stopped", () => {
    const listeners = new Map<string, () => void>();
    const viewport = {
      height: 800, offsetTop: 0, scale: 1,
      addEventListener: (type: string, fn: () => void) => { listeners.set(type, fn); },
      removeEventListener: (type: string) => { listeners.delete(type); },
    };
    const props = new Map<string, string>();
    const style = { setProperty: (name: string, value: string) => { props.set(name, value); } };
    const stop = trackKeyboardInset({ viewport, style, layoutHeight: () => 800 });
    expect(props.get("--keyboard-inset")).toBe("0px");
    expect(props.get("--visual-height")).toBe("800px");

    viewport.height = 460;
    listeners.get("resize")?.();
    expect(props.get("--keyboard-inset")).toBe("340px");
    expect(props.get("--visual-height")).toBe("460px");
    expect(listeners.has("scroll")).toBe(true);

    stop();
    expect(listeners.size).toBe(0);
  });

  it("does nothing where the browser has no VisualViewport", () => {
    const props = new Map<string, string>();
    trackKeyboardInset({ viewport: null, style: { setProperty: (n: string, v: string) => { props.set(n, v); } }, layoutHeight: () => 800 })();
    expect(props.size).toBe(0);
  });
});
