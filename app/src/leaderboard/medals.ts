// The medals for places 1–3 — one visual language for the leaderboard rows and the player cards (SPEC 1.1
// F18). Which player gets one comes from core (`podiumPlaces`: ties share a medal, none while all scores are equal).
import type { PodiumPlace } from "gg-counter-core";

/** The medal emoji of each podium place. */
export const MEDALS: Readonly<Record<PodiumPlace, string>> = { 1: "🥇", 2: "🥈", 3: "🥉" };
