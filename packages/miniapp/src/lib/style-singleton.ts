/**
 * CSP-safe stand-in for `react-style-singleton` 2.2.3 (MIT, theKashey), wired in by the `resolve.alias`
 * of app/vite.config.ts. Radix Dialog and DropdownMenu lock the page scroll through react-remove-scroll,
 * whose styles the original injects as a `<style>` element — blocked by our `style-src 'self'`
 * (scripts/csp.ts). Constructed stylesheets in `document.adoptedStyleSheets` are CSSOM, not markup,
 * so the policy allows them and the scroll lock works as before (security §1, DECISIONS 2026-11-19).
 */
import { useEffect } from "react";

/** One shared stylesheet: added by the first user, removed when the last one is gone (the original's contract). */
export interface StyleSheetSingleton {
  readonly add: (css: string) => void;
  readonly remove: () => void;
}

/** Props of the component {@link styleSingleton} returns; `dynamic` is accepted for API parity and ignored. */
interface StyleProps {
  readonly styles: string;
  readonly dynamic?: boolean;
}

/** Adopts `css` as a constructed stylesheet and returns it, or null where the browser has no constructed stylesheets. */
function adoptSheet(css: string): CSSStyleSheet | null {
  // Safari < 16.4 only: without the API the page keeps scrolling under a dialog; the dialog itself works.
  if (typeof CSSStyleSheet === "undefined" || !("replaceSync" in CSSStyleSheet.prototype)) return null;
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(css);
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  return sheet;
}

/** Removes `sheet` from the document's adopted stylesheets. */
function dropSheet(sheet: CSSStyleSheet): void {
  document.adoptedStyleSheets = document.adoptedStyleSheets.filter((adopted) => adopted !== sheet);
}

/**
 * Returns a counted stylesheet: the first `add` adopts its CSS, later ones only count, and the last
 * `remove` drops it — the same contract as the original `stylesheetSingleton`.
 */
export function stylesheetSingleton(): StyleSheetSingleton {
  let users = 0;
  let sheet: CSSStyleSheet | null = null;
  return {
    add: (css) => {
      if (users === 0) sheet = adoptSheet(css);
      users += 1;
    },
    remove: () => {
      users -= 1;
      if (users > 0 || sheet === null) return;
      dropSheet(sheet);
      sheet = null;
    },
  };
}

/**
 * Returns a component that keeps `styles` adopted while at least one instance is mounted (the
 * original's `styleSingleton`, the only export react-remove-scroll and react-remove-scroll-bar use).
 */
export function styleSingleton(): (props: StyleProps) => null {
  const sheet = stylesheetSingleton();
  const useStyle = (styles: string): void => {
    useEffect(() => {
      sheet.add(styles);
      return () => { sheet.remove(); };
    }, [styles]);
  };
  const Style = ({ styles }: StyleProps): null => {
    useStyle(styles);
    return null;
  };
  return Style;
}
