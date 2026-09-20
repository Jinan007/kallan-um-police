import { describe, expect, it } from "vitest";
import type { RoleId } from "../config/rules";
import { initialState, reducer } from "./reducer";
import type { Action } from "./reducer";

const NAMES = ["Anu", "Biju", "Chandran", "Deepa"];
const CHITS: RoleId[] = ["raja", "police", "kallan", "rani"];
const run = (...actions: Action[]) => actions.reduce(reducer, initialState);

const playRound = (): Action[] => [
  { type: "SHUFFLE_DONE" },
  ...NAMES.flatMap((_, i): Action[] => [{ type: "TAP_CHIT", slot: i }, { type: "PEEK_DONE" }]),
  { type: "CONTINUE" },
  { type: "ACCUSE", playerId: 2 },
];

describe("history and reset", () => {
  it("records each round's points for the scoreboard", () => {
    const s = run(
      { type: "START", players: NAMES, totalRounds: 2, mode: "STEAL", chits: CHITS },
      ...playRound(),
      { type: "CONTINUE" }, { type: "CONTINUE" },
      { type: "NEXT_ROUND", chits: CHITS },
      ...playRound(),
    );
    expect(s.history).toEqual([[1000, 500, 0, 700], [1000, 500, 0, 700]]);
    expect(s.totals).toEqual([2000, 1000, 0, 1400]);
  });

  it("RESET works from any phase and keeps names and settings", () => {
    const mid = run(
      { type: "START", players: NAMES, totalRounds: 3, mode: "PENALTY", chits: CHITS },
      ...playRound(),
    );
    const s = reducer(mid, { type: "RESET" });
    expect(s).toMatchObject({ phase: "SETUP", players: NAMES, totalRounds: 3, mode: "PENALTY", totals: [], history: [] });
  });
});

