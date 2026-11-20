/**
 * Reads design tokens (design/tokens.css) at run time, so motion and spacing used from code follow the same
 * values as the CSS — including the reduced-motion block, which turns the movement durations into 0ms.
 */

/** Returns milliseconds from a CSS time ("250ms", "0.3s"); 0 for anything else. */
export function parseDuration(value: string): number {
  const match = /^\s*(-?[\d.]+)(ms|s)\s*$/.exec(value);
  if (match === null) return 0;
  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return match[2] === "s" ? amount * 1000 : amount;
}

/** Returns pixels from a CSS length in px ("12px"); `fallback` for anything else. */
export function parsePixels(value: string, fallback: number): number {
  const match = /^\s*([\d.]+)px\s*$/.exec(value);
  const amount = match === null ? Number.NaN : Number(match[1]);
  return Number.isFinite(amount) ? amount : fallback;
}

/** Returns the raw value of the custom property `name` ("--duration-base") on the root element. */
export function readToken(name: `--${string}`): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name);
}

/** Returns a duration token in milliseconds (0 under reduced motion for the movement tokens). */
export function tokenMs(name: `--duration-${string}`): number {
  return parseDuration(readToken(name));
}
