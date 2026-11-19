// "Share app" (app-shell §8): the device's share sheet with the app's name, tagline and address;
// where there is none (most desktops) the address is copied. Cancelling the sheet is not an error.
import { app } from "../config";

/** How sharing ended. */
export type ShareAppOutcome = "shared" | "copied" | "cancelled" | "failed";

/** Returns true when `error` means the user closed the share sheet. */
function isCancel(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

/** Shares the app's address with the share sheet, else copies it; never throws. */
export async function shareApp(): Promise<ShareAppOutcome> {
  // because lib.dom types share and clipboard as always present, but browsers omit them
  const nav: Partial<Navigator> = navigator;
  if (nav.share) {
    try {
      await nav.share({ title: app.name, text: app.tagline, url: app.url });
      return "shared";
    } catch (error: unknown) {
      if (isCancel(error)) return "cancelled";
      // because some browsers refuse share() outside a direct tap: copying still works there
    }
  }
  try {
    if (!nav.clipboard) return "failed";
    await nav.clipboard.writeText(app.url);
    return "copied";
  } catch {
    // because the clipboard can be blocked (permissions, insecure context): the caller says so
    return "failed";
  }
}
