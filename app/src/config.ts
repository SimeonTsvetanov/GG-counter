// The single import point of app.config.ts inside app/src (app-shell rule 1): name, version, menu,
// footer, Help texts and links all come from here. Typed as AppConfig so the `as const` literals widen.
import { app as config, type AppConfig } from "../../app.config.ts";

export type { AppText, LanguageCode, MenuGroup, ShellItemId } from "../../app.config.ts";

/** The app's configuration (app.config.ts at the repo root). */
export const app: AppConfig = config;
