// The page's text sharing (app-shell §8), behind the contract's `shell.share` (miniapp/context.ts): the
// device's share sheet, else the clipboard. Cancelling the sheet is not an error. The game screen decides
// what to share and what to say about the outcome (gg-counter-miniapp share/share-leaderboard.ts).
import type { MiniAppContext } from "gg-counter-miniapp/contract";

/** What is shared: a text, with an optional title and address. */
type ShareRequest = Parameters<MiniAppContext["shell"]["share"]>[0];

/** How sharing ended: handed to the share sheet, copied, cancelled by the user, or not possible. */
type ShareOutcome = Awaited<ReturnType<MiniAppContext["shell"]["share"]>>;

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
 * Shares `data` with Web Share, else copies its text (and address, when given); never throws.
 * @remarks A cancelled share sheet does nothing; any other refusal of Web Share (e.g. not allowed
 * outside a tap) falls back to the clipboard. Only the given fields reach the share sheet.
 */
export async function shareOrCopy({ title, text, url }: ShareRequest): Promise<ShareOutcome> {
  // because lib.dom types share and clipboard as always present, but browsers omit them
  const nav: Partial<Navigator> = typeof navigator === "undefined" ? {} : navigator;
  if (nav.share) {
    try {
      await nav.share({ ...(title === undefined ? {} : { title }), text, ...(url === undefined ? {} : { url }) });
      return "shared";
    } catch (error: unknown) {
      if (isCancel(error)) return "cancelled";
    }
  }
  return (await copy(nav, url === undefined ? text : `${text}\n${url}`)) ? "copied" : "failed";
}
