// Unit and property tests of the policy-source reader (scripts/legal.ts) and the real content/legal
// sources: every page parses, nothing is left unfilled, and facts written into the text match the code.
import { readFileSync } from "node:fs";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { app as config, type AppConfig } from "../app.config.ts";
import { MAX_NAME_LENGTH, MAX_PLAYERS } from "../packages/core/src/limits.ts";
import { en } from "../app/src/i18n/en.ts";
import { POLICY_PAGES, type LegalInline } from "../app/src/ui/legal-document.ts";
import { isoDate, legalPlaceholders, parseBlock, parseInlines, parseLegalDocument, readLegalDocuments } from "./legal.ts";

const app: AppConfig = config;
const legalDir = new URL("../content/legal/", import.meta.url).pathname;
const values = legalPlaceholders(app);

/** Returns the Markdown a list of runs came from (inverse of parseInlines for text without links). */
function markdownOf(inlines: readonly LegalInline[]): string {
  return inlines
    .map((inline) => {
      switch (inline.kind) {
        case "strong":
          return `**${inline.text}**`;
        case "code":
          return `\`${inline.text}\``;
        case "email":
          return "{email}";
        case "link":
          return `[${inline.text}](${inline.href})`;
        case "text":
          return inline.text;
        default:
          return inline satisfies never;
      }
    })
    .join("");
}

describe("parseInlines", () => {
  it("splits text, **strong**, `code`, [links](…) and the email", () => {
    expect(parseInlines("See **Settings → Your data**, `x.json`, [Privacy](/GG-counter/privacy/) or {email}.")).toEqual([
      { kind: "text", text: "See " },
      { kind: "strong", text: "Settings → Your data" },
      { kind: "text", text: ", " },
      { kind: "code", text: "x.json" },
      { kind: "text", text: ", " },
      { kind: "link", text: "Privacy", href: "/GG-counter/privacy/" },
      { kind: "text", text: " or " },
      { kind: "email" },
      { kind: "text", text: "." },
    ]);
  });

  it("refuses links that are not https:, mailto: or our own path", () => {
    // eslint-disable-next-line no-script-url -- the guard under test must refuse exactly this URL
    for (const href of ["javascript:alert(1)", "http://example.com", "data:text/html,x", "privacy/"]) {
      expect(() => parseInlines(`[x](${href})`)).toThrow(/must start with/);
    }
  });

  it("property: text without links never throws and gives back its Markdown", () => {
    const pieces = fc.constantFrom("a", "Б", " ", "*", "**", "`", "{email}", "{", "}", "(", ")", "—", "−");
    fc.assert(
      fc.property(fc.array(pieces, { maxLength: 40 }), (parts) => {
        const text = parts.join("");
        expect(markdownOf(parseInlines(text))).toBe(text);
      }),
    );
  });
});

describe("parseBlock", () => {
  it("reads headings, lists with continuation lines, ordered lists and paragraphs", () => {
    expect(parseBlock("## When data reaches us")).toEqual({ kind: "heading", inlines: [{ kind: "text", text: "When data reaches us" }] });
    expect(parseBlock("- one\n  more\n- two")).toEqual({ kind: "list", isOrdered: false, items: [[{ kind: "text", text: "one more" }], [{ kind: "text", text: "two" }]] });
    expect(parseBlock("1. first\n2. second")).toMatchObject({ kind: "list", isOrdered: true, items: [[{ text: "first" }], [{ text: "second" }]] });
    expect(parseBlock("line one\n  line two")).toEqual({ kind: "paragraph", inlines: [{ kind: "text", text: "line one line two" }] });
  });
});

describe("isoDate", () => {
  it("turns the English date of the sources into YYYY-MM-DD and refuses anything else", () => {
    expect(isoDate("19", "November", "2026")).toBe("2026-11-19");
    expect(isoDate("1", "January", "2027")).toBe("2027-01-01");
    expect(isoDate("19", "Nov", "2026")).toBeUndefined();
    expect(isoDate("32", "May", "2026")).toBeUndefined();
  });
});

describe("parseLegalDocument", () => {
  const source = "<!-- note -->\n\n**Privacy** — Last updated: 19 November 2026\n\n- **Who:** {App}, {country}: {email}\n";

  it("drops template comments, fills placeholders and reads the title and date", () => {
    expect(parseLegalDocument("privacy", source, values)).toEqual({
      id: "privacy",
      title: "Privacy",
      updated: "2026-11-19",
      blocks: [{ kind: "list", isOrdered: false, items: [[{ kind: "strong", text: "Who:" }, { kind: "text", text: " GG Counter, Bulgaria: " }, { kind: "email" }]] }],
    });
  });

  it("fails on a placeholder without a value and on a missing date line", () => {
    expect(() => parseLegalDocument("terms", "**Terms** — Last updated: 19 November 2026\n\n{linked in}", values)).toThrow(/\{linked in\} has no value/);
    expect(() => parseLegalDocument("terms", "**Terms**\n\nText", values)).toThrow(/Last updated/);
  });
});

describe("content/legal (the real sources)", () => {
  const docs = readLegalDocuments(app, legalDir);
  const source = (page: string): string => readFileSync(`${legalDir}${page}.md`, "utf8");

  it("has every policy page, dated, with the dialog title of en.ts", () => {
    expect(docs.map((doc) => doc.id)).toEqual([...POLICY_PAGES]);
    for (const doc of docs) {
      expect(doc.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(doc.title).toBe(en.shell.legal.titles[doc.id]);
      expect(doc.blocks.length).toBeGreaterThan(0);
    }
  });

  it("links only to https sites, our own pages or files, and dialogs that exist", () => {
    const hrefs = docs.flatMap((doc) => JSON.stringify(doc.blocks).match(/"href":"[^"]+"/g) ?? []);
    for (const href of hrefs) expect(href).toMatch(/"href":"(https:\/\/|\/GG-counter\/(#help|#report|terms\/|privacy\/|ai-notice\/|third-party-licenses\.txt|$))/);
  });

  it("states the limits of core and the Buy Me a Coffee link of app.config.ts", () => {
    expect(source("support")).toContain(`up to ${String(MAX_PLAYERS)} players per game, names up to ${String(MAX_NAME_LENGTH)} characters, scores from −999,999 to\n  999,999`);
    expect(source("support")).toContain(`(${app.shell.buyMeACoffee})`);
  });

  it("names every storage key the app uses in plain words in Privacy", () => {
    const privacy = source("privacy");
    for (const fact of ["local storage", "session storage", "Cache Storage", "gg-counter-data-YYYY-MM-DD.json", "GitHub Pages", "КЗЛД", "one month"]) {
      expect(privacy).toContain(fact);
    }
  });
});
