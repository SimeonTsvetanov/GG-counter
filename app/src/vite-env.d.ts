// Vite's client types (asset `?url` imports, import.meta.env), resolved from the app package so the
// root tsconfig.eslint.json can type-check app/src without Vite installed at the workspace root.
/// <reference types="vite/client" />

/** `app.id` from app.config.ts, replaced at build time (app/vite.config.ts and vitest.config.ts `define`). */
declare const __APP_ID__: string;
