// How score history entries read on a player card's "last changes" line and in the history sheet
// (SPEC 1.1 F16): signed amounts with a true minus sign, and the clock time of each change.

/** U+2212 MINUS SIGN: the typographic minus, as wide as "+" in tabular figures (a hyphen is narrower). */
const MINUS = "−";

/**
 * Returns `delta` with its sign: "+5", "−2" (true minus sign), "+0.5".
 *
 * @remarks Plain digits without grouping, like the score on the card ("1234", not "1,234").
 */
export function formatDelta(delta: number): string {
  const digits = String(Math.abs(delta));
  return delta < 0 ? `${MINUS}${digits}` : `+${digits}`;
}

/** True when `a` and `b` fall on the same calendar day in the device's time zone. */
function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * Returns when a change happened, for `lang`: the clock time for today ("7:42 PM", "19:42"), else the
 * short date with the time ("Nov 19, 7:42 PM", "19.11, 19:42"); an unreadable time gives "".
 *
 * @param at - ISO 8601 time of the change.
 * @param now - The current time (a parameter so tests do not depend on the clock).
 */
export function formatEntryTime(at: string, now: Date, lang: string): string {
  const time = new Date(at);
  if (Number.isNaN(time.getTime())) return "";
  const options: Intl.DateTimeFormatOptions = isSameDay(time, now)
    ? { timeStyle: "short" }
    : { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" };
  return new Intl.DateTimeFormat(lang, options).format(time);
}
