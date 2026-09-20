import { describe, expect, it } from "vitest";
import type { RoleId } from "../config/rules";
import { initialState, policeId, reducer, rolesByPlayer, thiefId } from "./reducer";
import type { Action, GameState } from "./reducer";

const NAMES = ["Anu", "Biju", "Chandran", "Deepa", "Eldho"];
// slot -> role. Anu takes slot 0, Biju slot 1, ...
const CHITS: RoleId[] = ["raja", "police", "kallan", "rani", "mantri"];

const run = (state: GameState, ...actions: Action[]) => actions.reduce(reducer, state);

const started = () =>
  run(initialState, { type: "START", players: NAMES, totalRounds: 2, mode: "FIXED", chits: CHITS });

/** Everyone picks the slot with their own index and skips through the peeks. */
const allPicked = (s = started()) => {
  let cur = run(s, { type: "SHUFFLE_DONE" });
  for (let i = 0; i < NAMES.length; i++) {
    cur = run(cur, { type: "TAP_CHIT", slot: i }, { type: "PEEK_DONE" });
  }
  return cur;
};

describe("state machine", () => {
  it("START deals a round and moves to SHUFFLE", () => {
    const s = started();
    expect(s.phase).toBe("SHUFFLE");
    expect(s.round).toBe(1);
    expect(s.totals).toEqual([0, 0, 0, 0, 0]);
    expect(s.owners).toEqual([null, null, null, null, null]);
  });

  it("walks PICK -> REVEAL for each player, then POLICE_CALL", () => {
    let s = run(started(), { type: "SHUFFLE_DONE" });
    expect(s.phase).toBe("PICK");
    expect(s.pickIdx).toBe(0);
    s = run(s, { type: "TAP_CHIT", slot: 2 });
    expect(s.phase).toBe("REVEAL");
    expect(s.owners[2]).toBe(0);
    s = run(s, { type: "PEEK_DONE" });
    expect(s).toMatchObject({ phase: "PICK", pickIdx: 1 });
    expect(allPicked().phase).toBe("POLICE_CALL");
  });

  it("ignores a chit that is already taken", () => {
    let s = run(started(), { type: "SHUFFLE_DONE" }, { type: "TAP_CHIT", slot: 3 }, { type: "PEEK_DONE" });
    const before = s;
    s = run(s, { type: "TAP_CHIT", slot: 3 });
    expect(s).toBe(before);
  });

  it("knows who is police and thief", () => {
    const s = allPicked();
    expect(rolesByPlayer(s)).toEqual(CHITS);
    expect(policeId(s)).toBe(1);
    expect(thiefId(s)).toBe(2);
  });

  it("right accusation scores and reaches VERDICT", () => {
    const s = run(allPicked(), { type: "CONTINUE" }, { type: "ACCUSE", playerId: 2 });
    expect(s).toMatchObject({ phase: "VERDICT", correct: true, accusedId: 2 });
    expect(s.totals).toEqual([1000, 500, 0, 700, 600]);
  });

  it("wrong accusation scores per mode", () => {
    const s = run(allPicked(), { type: "CONTINUE" }, { type: "ACCUSE", playerId: 0 });
    expect(s.correct).toBe(false);
    expect(s.totals).toEqual([1000, 0, 500, 700, 600]);
  });

  it("police cannot accuse themselves", () => {
    const at = run(allPicked(), { type: "CONTINUE" });
    expect(run(at, { type: "ACCUSE", playerId: 1 })).toBe(at);
  });

  it("ignores actions in the wrong phase", () => {
    const s = started();
    expect(run(s, { type: "ACCUSE", playerId: 2 })).toBe(s);
    expect(run(s, { type: "TAP_CHIT", slot: 0 })).toBe(s);
    expect(run(s, { type: "CONTINUE" })).toBe(s);
  });

  it("plays 2 rounds, accumulates totals, then ENDs", () => {
    let s = run(allPicked(), { type: "CONTINUE" }, { type: "ACCUSE", playerId: 2 }, { type: "CONTINUE" });
    expect(s.phase).toBe("SCORE");
    s = run(s, { type: "CONTINUE" });
    expect(s.phase).toBe("INTERVAL");
    s = run(s, { type: "NEXT_ROUND", chits: CHITS });
    expect(s).toMatchObject({ phase: "SHUFFLE", round: 2 });
    expect(s.totals).toEqual([1000, 500, 0, 700, 600]); // carried over
    expect(s.deltas).toEqual([0, 0, 0, 0, 0]);
    s = allPicked(s);
    s = run(s, { type: "CONTINUE" }, { type: "ACCUSE", playerId: 0 }, { type: "CONTINUE" }, { type: "CONTINUE" });
    expect(s.phase).toBe("END");
    expect(s.totals).toEqual([2000, 500, 500, 1400, 1200]);
  });

  it("PLAY_AGAIN keeps players and settings but resets the game", () => {
    const s = run(initialState, { type: "PLAY_AGAIN" });
    expect(s.phase).toBe("SETUP");
    const ended = { ...allPicked(), phase: "END" as const };
    const again = run(ended, { type: "PLAY_AGAIN" });
    expect(again).toMatchObject({ phase: "SETUP", players: NAMES, totalRounds: 2, totals: [] });
  });
});
