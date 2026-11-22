// Unit tests of the CSP-safe react-style-singleton stand-in (src/lib/style-singleton.ts): the
// counted add/remove contract on `document.adoptedStyleSheets`, with a fake document and stylesheet.
import { describe, expect, it, vi } from "vitest";
import { stylesheetSingleton } from "../../src/lib/style-singleton.ts";

/** A stand-in for the browser's constructed stylesheet: keeps the text `replaceSync` got. */
class FakeSheet {
  text = "";
  replaceSync(css: string): void {
    this.text = css;
  }
}

/** Installs a fake document and CSSStyleSheet; returns the document whose adopted sheets the tests read. */
function fakeBrowser(): { adoptedStyleSheets: FakeSheet[] } {
  const doc = { adoptedStyleSheets: [] as FakeSheet[] };
  vi.stubGlobal("document", doc);
  vi.stubGlobal("CSSStyleSheet", FakeSheet);
  return doc;
}

const texts = (doc: { adoptedStyleSheets: FakeSheet[] }) => doc.adoptedStyleSheets.map((sheet) => sheet.text);

describe("stylesheetSingleton", () => {
  it("adopts the CSS once for the first user and drops it after the last one", () => {
    const doc = fakeBrowser();
    const sheet = stylesheetSingleton();
    sheet.add("body { overflow: hidden }");
    sheet.add("ignored: already adopted");
    expect(texts(doc)).toEqual(["body { overflow: hidden }"]);
    sheet.remove();
    expect(texts(doc)).toEqual(["body { overflow: hidden }"]);
    sheet.remove();
    expect(doc.adoptedStyleSheets).toEqual([]);
  });

  it("keeps the sheets other code adopted and adopts again after a full release", () => {
    const doc = fakeBrowser();
    const other = new FakeSheet();
    doc.adoptedStyleSheets = [other];
    const sheet = stylesheetSingleton();
    sheet.add("a {}");
    sheet.remove();
    sheet.add("b {}");
    expect(doc.adoptedStyleSheets[0]).toBe(other);
    expect(texts(doc)).toEqual(["", "b {}"]);
  });

  it("does nothing where the browser has no constructed stylesheets", () => {
    const doc = { adoptedStyleSheets: [] as FakeSheet[] };
    vi.stubGlobal("document", doc);
    vi.stubGlobal("CSSStyleSheet", undefined);
    const sheet = stylesheetSingleton();
    expect(() => { sheet.add("a {}"); sheet.remove(); }).not.toThrow();
    expect(doc.adoptedStyleSheets).toEqual([]);
  });
});
