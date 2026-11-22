// Build preset of the Scores mini-app for a host's Vite config (Quizzard PLAN §1.3, T-12): data the host
// merges into its own config. "isolated": the screen brings its own preflight, Tailwind theme and
// utilities and none of the host's component CSS applies inside it. Tailwind finds the screen's sources
// through the `@source` lines of src/styles/body.css (relative to that file, so they work from any Vite
// root); `source(none)` in src/styles/miniapp.css keeps it from scanning the host's files.
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

/** One plugin of `@tailwindcss/vite` (a Vite `Plugin`). */
type TailwindPlugin = ReturnType<typeof tailwindcss>[number];

/** What a host's build needs to know about this mini-app. */
export interface MiniAppVitePreset {
  /** = `meta.id`; scopes the CSS under `[data-miniapp="scores"]` in the host. */
  readonly id: "scores";
  /** "isolated": a reset layer first, then the screen's own preflight, theme, base, components, utilities. */
  readonly css: "shared" | "isolated";
  /** Module aliases the screen needs: the CSP-safe stand-in Radix's scroll lock loads (engineering → react §6). */
  readonly alias: Readonly<Record<string, string>>;
  /**
   * Extra Vite plugins the screen needs: Tailwind 4 (@tailwindcss/vite 4.3.5 declares Vite 5 to 8). Typed
   * by the plugin itself, so the type is the host's own Vite `Plugin` (pnpm resolves the plugin's Vite
   * peer to the host's), and this file imports no Vite.
   */
  readonly plugins: readonly TailwindPlugin[];
}

/** The Scores preset: isolated CSS, the style-singleton alias and the Tailwind plugin. */
export const vitePreset: MiniAppVitePreset = {
  id: "scores",
  css: "isolated",
  alias: { "react-style-singleton": fileURLToPath(new URL("./src/lib/style-singleton.ts", import.meta.url)) },
  plugins: tailwindcss(),
};
