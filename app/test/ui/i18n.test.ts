// Dictionary checks for every language file next to en.ts (app-shell → i18n §5) and the language
// switch itself: same keys, same {{placeholders}}, no empty text, plural forms in pairs.
import { readdirSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { bgAppText } from "../../src/i18n/bg.ts";
import { en } from "../../src/i18n/en.ts";
import { appText, applyLanguage, formatNumber, getLanguage, t } from "../../src/i18n/index.ts";

interface Tree { readonly [key: string]: string | Tree }

/** Every dotted key of a dictionary with its text. */
function flat(tree: Tree, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    if (typeof value === "string") out.set(prefix + key, value);
    else for (const [inner, text] of flat(value, `${prefix}${key}.`)) out.set(inner, text);
  }
  return out;
}

/** The sorted `{{placeholder}}` names of a text. */
const placeholders = (text: string): string[] => [...text.matchAll(/\{\{(\w+)\}\}/g)].map((match) => match[1]).sort();

const dir = new URL("../../src/i18n/", import.meta.url);
const languages = readdirSync(dir).filter((file) => /^[a-z]{2}\.ts$/.test(file) && file !== "en.ts").map((file) => file.slice(0, 2));
const english = flat(en);

describe("dictionaries", () => {
  it("finds the Bulgarian file", () => {
    expect(languages).toEqual(["bg"]);
  });

  it("English: no empty text; plural forms come in _one/_other pairs", () => {
    for (const [key, text] of english) expect(text.trim(), key).not.toBe("");
    for (const key of english.keys()) {
      const plural = /^(.*)_(one|other)$/.exec(key);
      if (plural) expect(english.has(`${plural[1]}_${plural[2] === "one" ? "other" : "one"}`), key).toBe(true);
    }
  });

  it.each(languages)("%s has the same keys and {{placeholders}} as English, and no empty text", async (lang) => {
    const module = (await import(new URL(`${lang}.ts`, dir).href)) as Record<string, Tree>;
    const other = flat(module[lang] ?? {});
    expect([...other.keys()].sort()).toEqual([...english.keys()].sort());
    for (const [key, text] of english) {
      const translated = other.get(key) ?? "";
      expect(translated.trim(), `${lang}:${key} empty`).not.toBe("");
      expect(placeholders(translated), `${lang}:${key} placeholders`).toEqual(placeholders(text));
    }
  });
});

describe("switching language", () => {
  afterEach(async () => { await applyLanguage("en"); });

  it("loads Bulgarian on demand: texts, plurals, numbers and app.config texts follow; back to English", async () => {
    expect(getLanguage()).toBe("en");
    expect(t("app.players.count", { count: 1 })).toBe("1 player");
    await applyLanguage("bg");
    expect(getLanguage()).toBe("bg");
    expect(t("shell.menu.items.settings")).toBe("Настройки");
    expect([t("app.players.count", { count: 1 }), t("app.players.count", { count: 2 })]).toEqual(["1 играч", "2 играчи"]);
    expect(t("app.leaderboard.points", { count: -1 })).toBe("-1 точка");
    // Bulgarian groups digits with a no-break space, so a number never wraps.
    expect(formatNumber(-999_999)).toBe("-999\u00a0999");
    expect(appText()).toEqual(bgAppText);
    expect(appText().faq[0]?.q).toBe("Безплатен ли е GG Counter?");
    await applyLanguage("en");
    expect(t("shell.menu.items.settings")).toBe("Settings");
    expect(appText().faq[0]?.q).toBe("Is GG Counter free?");
  });

  it("keeps a player's name as typed, even with {{…}} or $t(…) in it", () => {
    expect(t("app.players.remove", { name: "{{name}} $t(app.tagline) <b>" })).toBe("Remove {{name}} $t(app.tagline) <b>");
  });
});
