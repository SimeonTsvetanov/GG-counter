/**
 * Colour values from design/tokens.css for files that cannot use CSS variables: the `theme-color` metas
 * of index.html, the policy pages and 404.html, the web app manifest and og-image.png (PLAN T-12). Each
 * colour token in tokens.css notes the hex it was derived from (`/* #F5F5F7 / #000000 *\/` = light /
 * dark); that note is read here, so tokens.css stays the one source (design → design-system §1, §4).
 */
import { readFileSync } from "node:fs";

/** A colour token's value in the light and the dark theme, as #RRGGBB. */
export interface ThemePair {
  readonly light: string;
  readonly dark: string;
}

/** The tokens for the standalone pages (404, policy pages): design/tokens.css + the generated accent. */
export const TOKENS_CSS = "tokens.css";

/** design/tokens.css, read once. */
const DESIGN_TOKENS = readFileSync(new URL("../design/tokens.css", import.meta.url), "utf8");

/**
 * Returns the light and dark hex noted next to `token` in `css`; a token with one hex note uses it for both.
 *
 * @throws {@link Error} when the token or its hex note is missing — the build must not guess a colour.
 */
export function tokenHex(css: string, token: string): ThemePair {
  const line = css.split("\n").find((candidate) => candidate.trimStart().startsWith(`${token}:`));
  if (line === undefined) throw new Error(`design/tokens.css has no ${token}`);
  const hexes = line.slice(line.indexOf("/*")).match(/#[0-9A-Fa-f]{6}\b/g) ?? [];
  const light = hexes.at(0)?.toUpperCase();
  if (light === undefined) throw new Error(`design/tokens.css: ${token} has no "/* #RRGGBB */" note`);
  return { light, dark: hexes.at(1)?.toUpperCase() ?? light };
}

/** The page background (`--color-bg`): the browser bar colour (`theme-color`) and the manifest colours. */
export const THEME_BACKGROUND: ThemePair = tokenHex(DESIGN_TOKENS, "--color-bg");

/** Body and secondary text colours (`--color-text`, `--color-text-secondary`) for og-image.png. */
export const TEXT_COLOURS = {
  text: tokenHex(DESIGN_TOKENS, "--color-text"),
  secondary: tokenHex(DESIGN_TOKENS, "--color-text-secondary"),
} as const;

/**
 * Returns the two `theme-color` metas (light and dark, design-system §4); the app updates them when the
 * user forces a theme (app/src/providers/theme-provider.tsx).
 */
export function themeColorMetas(background: ThemePair = THEME_BACKGROUND): string[] {
  return [
    `<meta name="theme-color" media="(prefers-color-scheme: light)" content="${background.light}" />`,
    `<meta name="theme-color" media="(prefers-color-scheme: dark)" content="${background.dark}" />`,
  ];
}
