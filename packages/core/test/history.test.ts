// Score history (SPEC 1.1 F15–F17): merging quick taps, the cap, the last-scored player, and fast-check
// properties over random sequences of changes, removals and resets (score == base + sum of the deltas).
import { describe, expect, it } from "vitest";
import fc from "fast-check";
import {
  MAX_HISTORY_ENTRIES,
  MAX_SCORE,
  MERGE_WINDOW_MS,
  MIN_SCORE,
  adjustScore,
  lastScoredPlayerId,
  removeScoreEntry,
  resetPlayerScore,
  restoreScoreEntry,
  resetScores,
  scoreBase,
  sumOfDeltas,
  type GameState,
  type Player,
} from "../src/index.ts";

const START = Date.parse("2026-11-20T20:00:00.000Z");

/** ISO time `ms` milliseconds after {@link START} (the injected clock). */
function at(ms: number): string {
  return new Date(START + ms).toISOString();
}

/** A player with no history. */
function player(id: string, score = 0): Player {
  return { id, name: id, score, createdAt: at(0), history: [] };
}

const twoPlayers: GameState = { players: [player("A", 10), player("B")], lastUpdated: at(0), version: 2 };

/** Applies `delta` to player `id` at `ms`; fails the test when core refuses. */
function tap(game: GameState, id: string, delta: number, ms: number, entryId = `e${String(ms)}`): GameState {
  const result = adjustScore(game, id, { delta, entryId, at: at(ms) });
  if (!result.ok) throw new Error(result.error.message);
  return result.value;
}

/** The history of player `id` as [delta, at] pairs. */
function historyOf(game: GameState, id: string): [number, string][] {
  return (game.players.find((p) => p.id === id)?.history ?? []).map((entry) => [entry.delta, entry.at]);
}

describe("merging quick changes (DECISIONS 2026-11-20)", () => {
  it("taps in the same direction within the window become one entry with the last tap's time", () => {
    let game = tap(twoPlayers, "A", 1, 0, "first");
    game = tap(game, "A", 1, 800);
    game = tap(game, "A", 1, 800 + MERGE_WINDOW_MS);
    expect(historyOf(game, "A")).toEqual([[3, at(800 + MERGE_WINDOW_MS)]]);
    expect(game.players[0]?.history[0]?.id).toBe("first");
    expect(game.players[0]?.score).toBe(13);
  });
  it("a pause longer than the window starts a new entry", () => {
    const game = tap(tap(twoPlayers, "A", 1, 0), "A", 1, MERGE_WINDOW_MS + 1);
    expect(historyOf(game, "A")).toEqual([[1, at(0)], [1, at(MERGE_WINDOW_MS + 1)]]);
  });
  it("a change in the other direction starts a new entry (a correction stays visible)", () => {
    const game = tap(tap(twoPlayers, "A", 1, 0), "A", -1, 500);
    expect(historyOf(game, "A")).toEqual([[1, at(0)], [-1, at(500)]]);
  });
  it("a custom amount merges like taps (−5 then −1 within the window = −6)", () => {
    expect(historyOf(tap(tap(twoPlayers, "A", -5, 0), "A", -1, 1000), "A")).toEqual([[-6, at(1000)]]);
  });
  it("another player scored in between → no merge", () => {
    const game = tap(tap(tap(twoPlayers, "A", 1, 0), "B", 1, 100), "A", 1, 200);
    expect(historyOf(game, "A")).toEqual([[1, at(0)], [1, at(200)]]);
  });
  it("a clock set back never merges", () => {
    expect(historyOf(tap(tap(twoPlayers, "A", 1, 5000), "A", 1, 4000), "A")).toHaveLength(2);
  });
});

describe("the cap", () => {
  it(`keeps the newest ${String(MAX_HISTORY_ENTRIES)} entries; the older ones fold into the base`, () => {
    let game = twoPlayers;
    for (let i = 0; i < MAX_HISTORY_ENTRIES + 5; i += 1) game = tap(game, "A", 2, i * (MERGE_WINDOW_MS + 1));
    const ana = game.players[0];
    expect(ana.history).toHaveLength(MAX_HISTORY_ENTRIES);
    expect(ana.history[0].at).toBe(at(5 * (MERGE_WINDOW_MS + 1)));
    expect(ana.score).toBe(10 + 2 * (MAX_HISTORY_ENTRIES + 5));
    expect(scoreBase(ana)).toBe(10 + 2 * 5);
  });
});

describe("lastScoredPlayerId (F17)", () => {
  it("no history → null", () => {
    expect(lastScoredPlayerId(twoPlayers)).toBeNull();
  });
  it("the player with the newest entry; removing it moves to the next newest", () => {
    const game = tap(tap(twoPlayers, "A", 1, 0), "B", 3, 100, "b");
    expect(lastScoredPlayerId(game)).toBe("B");
    const removed = removeScoreEntry(game, "B", "b");
    expect(removed.ok && lastScoredPlayerId(removed.value)).toBe("A");
  });
  it("equal times → the player added first", () => {
    expect(lastScoredPlayerId(tap(tap(twoPlayers, "B", 1, 0), "A", 1, 0))).toBe("A");
  });
});

describe("base and sum", () => {
  it("pre-1.1 scores are all base", () => {
    expect(scoreBase(player("A", 34))).toBe(34);
    expect(sumOfDeltas([])).toBe(0);
  });
});

/** One random step: a change, a removal of the k-th entry, a reset of one player or of all. */
type Step =
  | { readonly kind: "adjust"; readonly who: number; readonly delta: number; readonly pause: number }
  | { readonly kind: "remove"; readonly who: number; readonly entry: number }
  | { readonly kind: "reset-one"; readonly who: number }
  | { readonly kind: "reset-all" };

const step: fc.Arbitrary<Step> = fc.oneof(
  { weight: 8, arbitrary: fc.record({ kind: fc.constant("adjust" as const), who: fc.nat(2), delta: fc.integer({ min: -400_000, max: 400_000 }).filter((d) => d !== 0), pause: fc.nat(2 * MERGE_WINDOW_MS) }) },
  { weight: 3, arbitrary: fc.record({ kind: fc.constant("remove" as const), who: fc.nat(2), entry: fc.nat(60) }) },
  { weight: 1, arbitrary: fc.record({ kind: fc.constant("reset-one" as const), who: fc.nat(2) }) },
  { weight: 1, arbitrary: fc.constant({ kind: "reset-all" as const }) },
);

/** Applies `s` to `game` at `ms` (entry id from the step number `n`); a step core refuses leaves the game as it was. */
function apply(game: GameState, s: Step, ms: number, n: number): GameState {
  const id = s.kind === "reset-all" ? "" : (game.players[s.who]?.id ?? "");
  switch (s.kind) {
    case "adjust": {
      const result = adjustScore(game, id, { delta: s.delta, entryId: `e${String(n)}`, at: at(ms) });
      return result.ok ? result.value : game;
    }
    case "remove": {
      const entry = game.players.at(s.who)?.history.at(s.entry);
      const result = entry === undefined ? null : removeScoreEntry(game, id, entry.id);
      return result?.ok ? result.value : game;
    }
    case "reset-one": {
      const result = resetPlayerScore(game, id);
      return result.ok ? result.value : game;
    }
    case "reset-all":
      return resetScores(game);
  }
}

describe("history (properties)", () => {
  // On failure fast-check prints { seed, path }: replay with fc.assert(property, { seed, path, endOnFailure: true })
  // and copy the shrunk counterexample into an example test above (engineering → testing §3).
  const start: GameState = { players: [player("A", 7), player("B", -3), player("C", 0)], lastUpdated: at(0), version: 2 };

  it("after any sequence: score == base + sum, history capped, ids unique, no 0 delta, scores in range", () => {
    fc.assert(fc.property(fc.array(step, { maxLength: 200 }), (steps) => {
      let game = start;
      let ms = 0;
      steps.forEach((s, n) => {
        ms += s.kind === "adjust" ? s.pause : 1;
        game = apply(game, s, ms, n);
        for (const p of game.players) {
          expect(scoreBase(p) + sumOfDeltas(p.history)).toBe(p.score);
          expect(p.history.length).toBeLessThanOrEqual(MAX_HISTORY_ENTRIES);
          expect(new Set(p.history.map((e) => e.id)).size).toBe(p.history.length);
          expect(p.history.every((e) => e.delta !== 0)).toBe(true);
          expect(p.score).toBeGreaterThanOrEqual(MIN_SCORE);
          expect(p.score).toBeLessThanOrEqual(MAX_SCORE);
        }
      });
    }));
  });

  it("the base changes only when old entries fold away or the score is reset", () => {
    fc.assert(fc.property(fc.array(step, { maxLength: 200 }), (steps) => {
      let game = start;
      let ms = 0;
      steps.forEach((s, n) => {
        ms += s.kind === "adjust" ? s.pause : 1;
        const before = game;
        game = apply(game, s, ms, n);
        game.players.forEach((p, i) => {
          const old = before.players.at(i);
          if (old === undefined || s.kind.startsWith("reset")) return;
          const folded = old.history.filter((e) => !p.history.some((kept) => kept.id === e.id) && !(s.kind === "remove" && old.history[s.entry]?.id === e.id));
          expect(scoreBase(p)).toBe(scoreBase(old) + sumOfDeltas(folded));
        });
      });
    }));
  });

  it("removing an entry right after adding it gives back the score before", () => {
    fc.assert(fc.property(fc.integer({ min: -999_999, max: 999_999 }), fc.integer({ min: -1000, max: 1000 }).filter((d) => d !== 0), (score, delta) => {
      const game: GameState = { ...start, players: [player("A", score)] };
      const added = adjustScore(game, "A", { delta, entryId: "x", at: at(0) });
      if (!added.ok) return;
      const removed = removeScoreEntry(added.value, "A", "x");
      expect(removed.ok && removed.value.players[0]).toEqual(game.players[0]);
    }));
  });

  it("removing any entry and restoring it at its index gives back the same game (Restore, F16)", () => {
    fc.assert(fc.property(fc.array(step, { maxLength: 120 }), fc.nat(), (steps, pick) => {
      let game = start;
      let ms = 0;
      steps.forEach((s, n) => {
        ms += s.kind === "adjust" ? s.pause : 1;
        game = apply(game, s, ms, n);
      });
      for (const p of game.players) {
        const index = p.history.length === 0 ? -1 : pick % p.history.length;
        const entry = p.history.at(index);
        if (entry === undefined) continue;
        const removed = removeScoreEntry(game, p.id, entry.id);
        if (!removed.ok) continue;
        const restored = restoreScoreEntry(removed.value, p.id, entry, index);
        expect(restored.ok && restored.value).toEqual(game);
      }
    }));
  });
});
