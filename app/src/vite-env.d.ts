// Vite's client types (asset `?url` imports, import.meta.env), resolved from the app package so the
// root tsconfig.eslint.json can type-check app/src without Vite installed at the workspace root.
/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/vanillajs" />

/** `app.id` from app.config.ts, replaced at build time (app/vite.config.ts and vitest.config.ts `define`). */
declare const __APP_ID__: string;

/** The last versions of CHANGELOG.md for What's new, read at build time (scripts/changelog.ts). */
declare const __CHANGELOG__: readonly {
  readonly version: string;
  readonly date: string | null;
  readonly items: readonly string[];
}[];

/** The open-source packages shipped in the app, for About (scripts/credits.ts). */
declare const __CREDITS__: readonly { readonly name: string; readonly license: string; readonly url: string }[];
