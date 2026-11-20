// Ranking: example tests plus fast-check properties (sorted, ties stable, total = sum, leader).
import { describe, expect, it } from "vitest";
import fc from "fast-check";
import { podiumPlaces, rank, type Player } from "../src/index.ts";

/** A player with `name` (also used as id) and `score`. */
function player(name: string, score: number): Player {
  return { id: name, name, score, createdAt: "2025-12-01T19:00:00.000Z", history: [] };
}

const players = fc.uniqueArray(fc.record({ id: fc.string(), score: fc.integer({ min: -999_999, max: 999_999 }) }), { selector: (p) => p.id, maxLength: 60 }).map((list) => list.map((p) => player(p.id, p.score)));

describe("rank (examples)", () => {
  it("orders by score, highest first (AC4)", () => {
    const ranking = rank([player("Boris", 27), player("Чен", -3), player("Ana", 34)]);
    expect(ranking.players.map((p) => p.name)).toEqual(["Ana", "Boris", "Чен"]);
    expect(ranking.totalScore).toBe(58);
    expect(ranking.leader?.name).toBe("Ana");
  });
  it("ties keep the order the players were added in; the leader is the first of them", () => {
    const ranking = rank([player("A", 5), player("B", 9), player("C", 9), player("D", 5)]);
    expect(ranking.players.map((p) => p.name)).toEqual(["B", "C", "A", "D"]);
    expect(ranking.leader?.name).toBe("B");
  });
  it("no players → empty order, total 0, no leader", () => {
    expect(rank([])).toEqual({ players: [], places: new Map(), totalScore: 0, leader: null });
  });
  it("does not reorder the input array", () => {
    const input = [player("A", 1), player("B", 2)];
    rank(input);
    expect(input.map((p) => p.name)).toEqual(["A", "B"]);
  });
});

describe("rank (properties)", () => {
  // On failure fast-check prints { seed, path }: replay with fc.assert(property, { seed, path, endOnFailure: true })
  // and copy the shrunk counterexample into an example test above (engineering → testing §3).
  it("is sorted by score, highest first, and keeps every player once", () => {
    fc.assert(fc.property(players, (list) => {
      const order = rank(list).players;
      expect([...order].map((p) => p.id).sort()).toEqual(list.map((p) => p.id).sort());
      for (let i = 1; i < order.length; i++) expect(order[i - 1].score).toBeGreaterThanOrEqual(order[i].score);
    }));
  });
  it("is stable: players with equal scores keep their input order", () => {
    fc.assert(fc.property(players, (list) => {
      const order = rank(list).players;
      const position = (p: Player): number => list.indexOf(p);
      for (let i = 1; i < order.length; i++) {
        if (order[i - 1].score === order[i].score) expect(position(order[i - 1])).toBeLessThan(position(order[i]));
      }
    }));
  });
  it("total is the sum of the scores; the leader is the first of the order", () => {
    fc.assert(fc.property(players, (list) => {
      const ranking = rank(list);
      expect(ranking.totalScore).toBe(list.reduce((sum, p) => sum + p.score, 0));
      expect(ranking.leader).toBe(ranking.players[0] ?? null);
    }));
  });
});

describe("rank → places (rank badges, SPEC 1.1 F18)", () => {
  it("ties share a place and the next place skips (34, 27, 27, 5 → 1, 2, 2, 4)", () => {
    const ranking = rank([player("A", 27), player("B", 34), player("C", 5), player("D", 27)]);
    expect([...ranking.places]).toEqual([["B", 1], ["A", 2], ["D", 2], ["C", 4]]);
  });
  it("everyone at 0 shares place 1", () => {
    expect([...rank([player("A", 0), player("B", 0)]).places.values()]).toEqual([1, 1]);
  });
  it("property: a place is 1 + the number of players with a higher score", () => {
    fc.assert(fc.property(players, (list) => {
      const { places } = rank(list);
      expect(places.size).toBe(list.length);
      for (const p of list) expect(places.get(p.id)).toBe(1 + list.filter((other) => other.score > p.score).length);
    }));
  });
});

describe("podiumPlaces (medals on the cards and the leaderboard, SPEC 1.1 F18)", () => {
  const medals = (list: Player[]) => [...podiumPlaces(rank(list))];
  it("34, 27, 27, 5 → 🥇 🥈 🥈 and no medal for place 4 (AC18)", () => {
    expect(medals([player("A", 34), player("B", 27), player("C", 27), player("D", 5)])).toEqual([["A", 1], ["B", 2], ["C", 2]]);
  });
  it("nobody while every score is equal (a new game, one player, all tied)", () => {
    expect(medals([player("A", 0), player("B", 0), player("C", 0)])).toEqual([]);
    expect(medals([player("A", 12)])).toEqual([]);
    expect(medals([])).toEqual([]);
  });
  it("the first points of a game: one 🥇, everyone still at 0 shares 🥈", () => {
    expect(medals([player("A", 0), player("B", 5), player("C", 0)])).toEqual([["B", 1], ["A", 2], ["C", 2]]);
  });
  it("property: a medal is the player's place, 1–3, and there are medals exactly when two scores differ", () => {
    fc.assert(fc.property(players, (list) => {
      const ranking = rank(list);
      const podium = podiumPlaces(ranking);
      expect(podium.size > 0).toBe(new Set(list.map((p) => p.score)).size > 1);
      for (const [id, place] of podium) expect(ranking.places.get(id)).toBe(place);
      if (podium.size > 0) for (const [id, place] of ranking.places) expect(podium.has(id)).toBe(place <= 3);
    }));
  });
});
