// The Scores mini-app: the chunk Quizzard loads for `#/scores` (contract `MiniAppEntry.load` reads the
// default export). Its stylesheet comes with it (isolated mode, vite-preset.ts), and the screen is placed
// for the context's host (placement.ts). The standalone site imports module.ts instead.
import "./styles/miniapp.css";
import type { MiniAppModule } from "./contract.ts";
import { createMount } from "./mount";
import { placeForHost } from "./placement.ts";

/**
 * Mounts the game screen; no Settings rows of its own yet (the standalone Settings covers export,
 * import and clear; Quizzard PLAN T-16 adds them).
 */
const scores: MiniAppModule = { mount: createMount(placeForHost) };

export default scores;
