// The words of the share text in the active UI language (SPEC §4, 1.2 F21). Core owns the layout (emoji, rows,
// line order); the dictionary gives the words. The English words give core's englishLeaderboardLabels exactly
// (app/test/ui/share-text.test.ts). The attribution line with the app link stays English in every language
// (app-shell → i18n §2: values sent out of the app stay English).
import { formatScore, type LeaderboardTextLabels } from "gg-counter-core";
import { app } from "../config";
import { getLanguage, t } from "../i18n";

/** The last line of every shared text (app-shell §8). */
export const ATTRIBUTION = `— Made with ${app.name} · ${app.url}`;

/** Returns "34 points" / "34 точки" with a true minus sign for negative scores. */
function points(score: number): string {
  return t("app.share.points", { count: score, score: formatScore(score) });
}

/** Returns the share-text labels in the active language. */
export function leaderboardLabels(): LeaderboardTextLabels {
  const list = new Intl.ListFormat(getLanguage(), { type: "conjunction" });
  return {
    title: t("app.share.title", { name: app.name }),
    winners: (names, score) => t("app.share.winner", { count: names.length, names: list.format(names), points: points(score) }),
    tie: (score) => t("app.share.tie", { points: points(score) }),
    summary: (count, total) => t("app.share.summary", { players: t("app.share.players", { count }), points: points(total) }),
    attribution: ATTRIBUTION,
  };
}

/**
 * Returns the date and time for the 📅 line: the browser's own format in English (as the snapshot line was
 * before), the UI language's otherwise ("20.11.2026 г., 21:45 ч.").
 */
export function shareDate(date: Date): string {
  const lang = getLanguage();
  return date.toLocaleString(lang === "en" ? undefined : lang, { dateStyle: "medium", timeStyle: "short" });
}
