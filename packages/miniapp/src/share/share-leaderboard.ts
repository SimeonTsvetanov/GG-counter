// Shares the session leaderboard as text (core `formatLeaderboard`, words from share-text.ts in the UI language)
// — one flow for the leaderboard card and the leaderboard dialog (app-shell §8). The host shares it
// (`Host.share`: Web Share, else the clipboard) with `{ title, text }` only: the text already ends with
// the app link, and apps that append `url` to the text (WhatsApp, Messages) would print it twice.
import { formatLeaderboard, type Player } from "gg-counter-core";
import type { Host, ShareOutcome } from "../host";
import { t } from "../i18n";
import { getAttribution } from "./attribution";
import { leaderboardLabels, shareDate } from "./share-text";

/** Returns the share text of `players` at `date` in the active language. */
export function leaderboardText(players: readonly Player[], date: Date): string {
  return formatLeaderboard({ players, date: shareDate(date), labels: leaderboardLabels() });
}

/**
 * Shares the leaderboard of `players` as text through `share`; never throws.
 *
 * @param players - the players in the order they were added; nothing happens when empty ("failed").
 * @param share - the host's share function.
 * @returns the outcome, for the caller's toast and for closing the leaderboard dialog.
 */
export function shareLeaderboard(players: readonly Player[], share: Host["share"]): Promise<ShareOutcome> {
  if (players.length === 0) return Promise.resolve("failed");
  return share({ title: t("app.shareTitle", { name: getAttribution().name }), text: leaderboardText(players, new Date()) });
}
