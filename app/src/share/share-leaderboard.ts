// Shares the session leaderboard as text (core `formatLeaderboard`, words from share-text.ts in the UI language)
// — one flow for the header Share button, the leaderboard card and the leaderboard dialog (app-shell §8).
// Web Share gets `{ title, text }` only: the text already ends with the app link, and apps that append `url`
// to the text (WhatsApp, Messages) would print it twice. Without Web Share the same text is copied.
import { formatLeaderboard, type Player } from "gg-counter-core";
import { app } from "../config";
import { t } from "../i18n";
import { leaderboardLabels, shareDate } from "./share-text";

/** How sharing ended: handed to the share sheet, copied, cancelled by the user, or not possible. */
export type ShareOutcome = "shared" | "copied" | "cancelled" | "failed";

/** Returns the share text of `players` at `date` in the active language. */
export function leaderboardText(players: readonly Player[], date: Date): string {
  return formatLeaderboard({ players, date: shareDate(date), labels: leaderboardLabels() });
}

/** Returns true when `error` means the user closed the share sheet (app-shell §8: silent). */
function isCancel(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

/** Copies `text`; false when there is no clipboard or it is blocked. */
async function copy(nav: Partial<Navigator>, text: string): Promise<boolean> {
  try {
    if (!nav.clipboard) return false;
    await nav.clipboard.writeText(text);
    return true;
  } catch {
    // because the clipboard can be blocked (permissions, insecure context): the caller says so
    return false;
  }
}

/**
 * Shares the leaderboard of `players` as text; never throws.
 *
 * @param players - the players in the order they were added; nothing happens when empty ("failed").
 * @returns the outcome, for the caller's toast and for closing the leaderboard dialog.
 * @remarks Order: Web Share → clipboard. A cancelled share sheet does nothing; any other refusal of Web
 * Share (e.g. not allowed outside a tap) falls back to the clipboard.
 */
export async function shareLeaderboard(players: readonly Player[]): Promise<ShareOutcome> {
  if (players.length === 0) return "failed";
  const text = leaderboardText(players, new Date());
  // because lib.dom types share and clipboard as always present, but browsers omit them
  const nav: Partial<Navigator> = typeof navigator === "undefined" ? {} : navigator;
  if (nav.share) {
    try {
      await nav.share({ title: t("app.shareTitle", { name: app.name }), text });
      return "shared";
    } catch (error: unknown) {
      if (isCancel(error)) return "cancelled";
    }
  }
  return (await copy(nav, text)) ? "copied" : "failed";
}
