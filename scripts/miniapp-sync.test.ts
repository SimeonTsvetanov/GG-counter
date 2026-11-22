// The game screen's package keeps a few values of app.config.ts because it never imports that file
// (Quizzard bundles it alone), and carries a verbatim copy of Quizzard's contract (PLAN GG-02, Quizzard
// PLAN §1.1 item 4): they must stay equal.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { faqBg, featureNamesBg, helpBg, stepsBg } from "gg-counter-miniapp/help/bg";
import { faqEn, featureNamesEn, helpEn, stepsEn } from "gg-counter-miniapp/help/en";
import { help } from "gg-counter-miniapp/help";
import { STANDALONE_ID, STANDALONE_NAME, STANDALONE_URL, STORAGE_AREA, meta } from "gg-counter-miniapp/meta";
import { LEGACY_KEYS, isOwnKey } from "gg-counter-miniapp/storage/keys";
import { app, l10n } from "../app.config.ts";

/**
 * SHA-256 of Quizzard's packages/core/src/contract.ts at commit 556af7f (2026-11-22). A change of the
 * copy must come from Quizzard: copy the file again and update this hash (Quizzard's
 * scripts/contract-sync.test.ts checks the copy byte for byte at every pin bump).
 */
const CONTRACT_SHA256 = "0a4db111b9d77c3cbb02d65265bd5e50bb8171a36285757ec268126aaf62e635";

describe("mini-app package ↔ app.config.ts", () => {
  it("shares the site's id, name and URL", () => {
    expect(STANDALONE_ID).toBe(app.id);
    expect(STANDALONE_NAME).toBe(app.name);
    expect(STANDALONE_URL).toBe(app.url);
  });

  it("declares the storage the site really uses: the namespace and the two pre-forge keys", () => {
    expect(meta.storage).toBe(STORAGE_AREA);
    expect(STORAGE_AREA.prefix).toBe(`${app.id}:v1:`);
    expect(STORAGE_AREA.extraKeys).toEqual(Object.values(LEGACY_KEYS));
    for (const key of [`${app.id}:v1:state`, `${app.id}:v1:lang`, ...Object.values(LEGACY_KEYS)]) expect(isOwnKey(key), key).toBe(true);
    expect(meta.languages).toEqual(app.languages);
  });

  it("is where app.config's steps, features and FAQ come from, in both languages", () => {
    expect({ steps: app.steps, features: app.features, faq: app.faq }).toEqual({ steps: stepsEn, features: featureNamesEn, faq: faqEn });
    expect({ steps: l10n.bg.steps, features: l10n.bg.features, faq: l10n.bg.faq }).toEqual({ steps: stepsBg, features: featureNamesBg, faq: faqBg });
    expect(help).toEqual({ en: helpEn, bg: helpBg });
    for (const section of [helpEn, helpBg]) expect(section.features.map((feature) => feature.text.trim().length > 0)).not.toContain(false);
    expect([helpBg.steps.length, helpBg.features.length, helpBg.faq.length]).toEqual([helpEn.steps.length, helpEn.features.length, helpEn.faq.length]);
  });

  it("carries Quizzard's contract unchanged", () => {
    const copy = readFileSync(new URL("../packages/miniapp/src/contract.ts", import.meta.url));
    expect(createHash("sha256").update(copy).digest("hex")).toBe(CONTRACT_SHA256);
    expect(meta.contract).toBe(1);
  });
});
