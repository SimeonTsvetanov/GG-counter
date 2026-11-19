// Shares the session leaderboard as text (core `formatLeaderboard`): Web Share first, else the
// clipboard. Used by the header Share button, the leaderboard dialog and the leaderboard card.
import { formatLeaderboard, type Player } from "gg-counter-core";
import { app } from "../config";
import { t } from "../i18n";

/**
 * lib.dom types `navigator.share` and `navigator.clipboard` as always present, but browsers omit
 * them (Web Share on most desktops, Clipboard outside secure contexts) — so feature-detect.
 */
function optionalNavigator(): Partial<Navigator> | undefined {
  return typeof navigator === "undefined" ? undefined : navigator;
}

/** What {@link copyToClipboard} needs. */
interface CopyRequest {
  clipboard: Clipboard;
  text: string;
  onShared: () => void;
}

/** Copies `text` and tells the user; `onShared` runs before the alert, as it always has. */
async function copyToClipboard({ clipboard, text, onShared }: CopyRequest): Promise<void> {
  await clipboard.writeText(text);
  onShared();
  if (typeof window !== "undefined") {
    window.alert(t("app.copiedSummary"));
  }
}

/**
 * Shares the leaderboard of `players` as text with a local-time snapshot.
 *
 * @param players - the players in the order they were added; nothing happens when empty.
 * @param onShared - called once the text was handed to Web Share or copied (closes the dialog).
 * @remarks Order: Web Share → clipboard (with an alert). When Web Share or the first copy throws
 * (e.g. the user cancels the share sheet), the error is logged and the clipboard is tried once more.
 */
export async function shareLeaderboard(players: readonly Player[], onShared: () => void): Promise<void> {
  if (players.length === 0) {
    return;
  }

  const text = formatLeaderboard({ players, snapshot: new Date().toLocaleString() });
  const nav = optionalNavigator();
  try {
    if (nav?.share) {
      await nav.share({ title: t("app.shareTitle", { name: app.name }), text });
      onShared();
      return;
    }

    if (nav?.clipboard) {
      await copyToClipboard({ clipboard: nav.clipboard, text, onShared });
      return;
    }
  } catch (error) {
    console.error("Sharing failed", error);
  }

  if (nav?.clipboard) {
    try {
      await copyToClipboard({ clipboard: nav.clipboard, text, onShared });
    } catch (clipboardError) {
      console.error("Clipboard copy failed", clipboardError);
    }
  }
}
