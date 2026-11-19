/**
 * The one Content-Security-Policy of GG Counter (engineering → security §1): GitHub Pages sets no
 * headers, so every HTML page carries it as the first element of `<head>`. Used by app/vite.config.ts
 * (index.html), scripts/static-page.ts (404.html) and scripts/legal-page.ts (the policy pages).
 */

/**
 * The directives of security §1 for a GitHub Pages app, in its order. Only our own files: no
 * feedback webhook or API (`connect-src 'self'`), no `.wasm` (no `'wasm-unsafe-eval'`); `blob:`
 * images and workers as the chapter lists them. Header-only directives (`frame-ancestors`,
 * `report-to`, `sandbox`) are ignored in a meta tag, so they are not here.
 */
const DIRECTIVES: readonly (readonly [name: string, sources: string])[] = [
  ["default-src", "'self'"],
  ["script-src", "'self'"],
  ["style-src", "'self'"],
  ["img-src", "'self' data: blob:"],
  ["font-src", "'self'"],
  ["connect-src", "'self'"],
  ["worker-src", "'self' blob:"],
  ["manifest-src", "'self'"],
  ["object-src", "'none'"],
  ["base-uri", "'self'"],
  ["form-action", "'self'"],
];

/** The policy text: `name sources` pairs joined by "; " (no quotes that would need HTML escaping). */
export const CONTENT_SECURITY_POLICY = DIRECTIVES.map(([name, sources]) => `${name} ${sources}`).join("; ");

/**
 * Returns the `<meta http-equiv="Content-Security-Policy">` tag. It must be the first element of
 * `<head>`: a meta CSP does not cover anything the parser met before it.
 */
export function cspMetaTag(): string {
  return `<meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}" />`;
}
