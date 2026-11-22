// The Scores module (contract `MiniAppModule`) as the standalone site mounts it: without its stylesheet
// (the page brings the screen's CSS through its own app.css, after its tokens and fonts) and with the
// page's placement only (placement.ts). Quizzard imports the package entry (index.ts) instead.
import type { MiniAppModule } from "./contract.ts";
import { createMount } from "./mount";
import { placeOnPage } from "./placement.ts";

/**
 * Mounts the game screen on the standalone page; no Settings rows of its own yet (the page's Settings
 * covers export, import and clear; Quizzard PLAN T-16 adds them).
 */
export const scoresModule: MiniAppModule = { mount: createMount(placeOnPage) };
