// Unit tests for the UI texts (app/src/i18n), the limit messages and the deep-link parser of the shell.
import { describe, expect, it } from "vitest";
import { en } from "../../src/i18n/en.ts";
import { formatNumber, t, type MessageKey } from "../../src/i18n/index.ts";
import { limitCode, limitMessage } from "../../src/players/limit-message.ts";
import { SHELL_DIALOGS, dialogFromHash } from "../../src/ui/use-shell-dialog.ts";
import { app } from "../../src/config.ts";

/** Every dotted key of the dictionary with its text. */
function entries(node: object, prefix = ""): [string, string][] {
  return Object.entries(node).flatMap(([key, value]): [string, string][] =>
    typeof value === "string" ? [[`${prefix}${key}`, value]] : entries(value as object, `${prefix}${key}.`)
  );
}

describe("t()", () => {
  it("fills placeholders and keeps unknown ones visible", () => {
    expect(t("app.players.nameFor", { name: "Ana" })).toBe("Player name for Ana");
    expect(t("shell.rights", { year: 2027, author: "Simeon Tsvetanov" })).toBe("© 2027 Simeon Tsvetanov. All rights reserved.");
    expect(t("app.players.nameFor")).toBe("Player name for {{name}}");
  });

  it("returns every text of the dictionary; none is empty", () => {
    const all = entries(en);
    expect(all.length).toBeGreaterThan(100);
    for (const [key, text] of all) {
      expect(text.trim(), key).not.toBe("");
      // because entries() only yields real paths, each one is a MessageKey
      expect(t(key as MessageKey).length, key).toBeGreaterThan(0);
    }
  });

  it("a path that does not end at a text gives no dictionary text (a bug the type forbids)", () => {
    // because MessageKey forbids it; since PLAN T-09 i18next answers with the key instead of throwing
    const texts = new Set(entries(en).map(([, text]) => text));
    for (const key of ["shell.menu", "shell.nope.deeper"]) {
      const text = t(key as MessageKey);
      expect(texts.has(text), key).toBe(false);
      expect(text).toContain(key);
    }
  });

  it("picks the plural form with count", () => {
    expect([t("app.players.count", { count: 1 }), t("app.players.count", { count: 3 })]).toEqual(["1 player", "3 players"]);
    expect(t("app.leaderboard.points", { count: 1 })).toBe("1 pts");
  });

  it("every menu group and entry of app.config.ts has a label", () => {
    for (const group of app.shell.menu) {
      expect(t(`shell.menu.${group.id}`)).not.toMatch(/\{\{/);
      for (const id of group.items) expect(t(`shell.menu.items.${id}`).length).toBeGreaterThan(0);
    }
  });

  it("formats numbers with digit grouping", () => {
    expect(formatNumber(-999_999)).toBe("-999,999");
  });
});

describe("limitMessage", () => {
  it("keeps only the codes that have a message", () => {
    expect(["PLAYERS_TOO_MANY", "NAME_TOO_LONG", "SCORE_OUT_OF_RANGE", "NAME_EMPTY", "x"].map(limitCode)).toEqual(["PLAYERS_TOO_MANY", "NAME_TOO_LONG", "SCORE_OUT_OF_RANGE", null, null]);
  });

  it("explains the three limits with their numbers", () => {
    expect(limitMessage("PLAYERS_TOO_MANY")).toBe("A game can have up to 50 players. Remove a player to add another.");
    expect(limitMessage("NAME_TOO_LONG")).toMatch(/up to 40 characters/);
    expect(limitMessage("SCORE_OUT_OF_RANGE")).toMatch(/from -999,999 to 999,999/);
  });

  it("stays silent where the pre-forge app was silent (blank name, not a number, missing player)", () => {
    for (const code of ["NAME_EMPTY", "SCORE_INVALID", "PLAYER_NOT_FOUND"]) expect(limitMessage(code)).toBeNull();
  });
});

describe("dialogFromHash", () => {
  it("opens a known dialog, with an optional Help section", () => {
    for (const id of SHELL_DIALOGS) expect(dialogFromHash(`#${id}`)).toEqual({ id });
    expect(dialogFromHash("#help/install")).toEqual({ id: "help", section: "install" });
  });

  it("ignores other hashes", () => {
    // "#terms" was here until PLAN T-10 made every policy page a dialog (app-shell §3 deep links).
    for (const hash of ["", "#", "#cookies", "#Help", "#help-install", "#Privacy"]) expect(dialogFromHash(hash)).toBeNull();
  });
});
