// The words of the share text in the active UI language (PLAN T-09). Core owns the format (emoji, line
// order); the dictionary gives the words. In English they give core's public format byte for byte
// (SPEC §4, e2e AC5; app/test/ui/share-text.test.ts). Numbers stay plain digits ("-3", "1234"), as
// before, so the text reads the same in any chat.
import { bulgarianOrdinal, ordinal, type LeaderboardTextLabels } from "gg-counter-core";
import { app, type LanguageCode } from "../config";
import { getLanguage, t } from "../i18n";

/** The ordinal of a place ("1st", "1-во") in each UI language. */
const PLACE: Readonly<Record<LanguageCode, (place: number) => string>> = { en: ordinal, bg: bulgarianOrdinal };

/** Returns the share-text labels in the active language. */
export function leaderboardLabels(): LeaderboardTextLabels {
  const place = PLACE[getLanguage()];
  return {
    title: t("app.share.title", { name: app.name }),
    line: (position, name, score) => t("app.share.line", { place: place(position), name, points: t("app.share.points", { count: score }) }),
    total: (total) => t("app.share.total", { total }),
    players: (count) => t("app.share.players", { players: count }),
    snapshot: (time) => t("app.share.snapshot", { time }),
  };
}

/**
 * Returns the time for the snapshot line. English keeps the browser's own date format, as before
 * T-09; another UI language uses its own (19.11.2026 г., 10:00:00).
 */
export function snapshotTime(date: Date): string {
  const lang = getLanguage();
  return date.toLocaleString(lang === "en" ? undefined : lang);
}
