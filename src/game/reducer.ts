import type { RoleId, WrongGuessMode } from "../config/rules";
import { DEFAULT_MODE, LIMITS } from "../config/rules";
import { addTotals, isCorrectGuess, scoreRound } from "./scoring";

export type Phase =
  | "SETUP" | "SHUFFLE" | "PICK" | "REVEAL" | "POLICE_CALL"
  | "ACCUSE" | "VERDICT" | "SCORE" | "INTERVAL" | "END";

export interface GameState {
  phase: Phase;
  /** Player id = index into this array. */
  players: string[];
  totalRounds: number;
  mode: WrongGuessMode;
  /** 1-based. */
  round: number;
  /** Slot index -> role. Shuffled each round. */
  chits: RoleId[];
  /** Slot index -> id of the player who took it, or null. */
  owners: (number | null)[];
  /** Whose turn it is to pick / reveal. */
  pickIdx: number;
  pickedSlot: number | null;
  accusedId: number | null;
  correct: boolean | null;
  /** Points earned this round, per player. */
  deltas: number[];
  /** Running totals, per player. */
  totals: number[];
}

export type Action =
  | { type: "START"; players: string[]; totalRounds: number; mode: WrongGuessMode; chits: RoleId[] }
  | { type: "SHUFFLE_DONE" }
  | { type: "TAP_CHIT"; slot: number }
  | { type: "PEEK_DONE" }
  | { type: "CONTINUE" }
  | { type: "ACCUSE"; playerId: number }
  | { type: "NEXT_ROUND"; chits: RoleId[] }
  | { type: "PLAY_AGAIN" }
  | { type: "RESTORE"; state: GameState };

export const initialState: GameState = {
  phase: "SETUP",
  players: [],
  totalRounds: LIMITS.defaultRounds,
  mode: DEFAULT_MODE,
  round: 1,
  chits: [],
  owners: [],
  pickIdx: 0,
  pickedSlot: null,
  accusedId: null,
  correct: null,
  deltas: [],
  totals: [],
};

export function rolesByPlayer(s: Pick<GameState, "chits" | "owners" | "players">): (RoleId | null)[] {
  return s.players.map((_, id) => {
    const slot = s.owners.indexOf(id);
    return slot === -1 ? null : s.chits[slot];
  });
}

export function policeId(s: GameState): number {
  return rolesByPlayer(s).indexOf("police");
}

export function thiefId(s: GameState): number {
  return rolesByPlayer(s).indexOf("kallan");
}

function freshRound(s: GameState, round: number, chits: RoleId[]): GameState {
  return {
    ...s,
    phase: "SHUFFLE",
    round,
    chits,
    owners: chits.map(() => null),
    pickIdx: 0,
    pickedSlot: null,
    accusedId: null,
    correct: null,
    deltas: s.players.map(() => 0),
  };
}

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "RESTORE":
      return action.state;

    case "START": {
      if (state.phase !== "SETUP") return state;
      const base: GameState = {
        ...state,
        players: action.players,
        totalRounds: action.totalRounds,
        mode: action.mode,
        totals: action.players.map(() => 0),
      };
      return freshRound(base, 1, action.chits);
    }

    case "SHUFFLE_DONE":
      return state.phase === "SHUFFLE" ? { ...state, phase: "PICK" } : state;

    case "TAP_CHIT": {
      if (state.phase !== "PICK") return state;
      if (state.owners[action.slot] !== null) return state; // already taken
      const owners = [...state.owners];
      owners[action.slot] = state.pickIdx;
      return { ...state, phase: "REVEAL", owners, pickedSlot: action.slot };
    }

    case "PEEK_DONE": {
      if (state.phase !== "REVEAL") return state;
      const next = state.pickIdx + 1;
      if (next < state.players.length) {
        return { ...state, phase: "PICK", pickIdx: next, pickedSlot: null };
      }
      return { ...state, phase: "POLICE_CALL", pickedSlot: null };
    }

    case "ACCUSE": {
      if (state.phase !== "ACCUSE") return state;
      if (action.playerId === policeId(state)) return state; // no self-accusing
      if (action.playerId < 0 || action.playerId >= state.players.length) return state;
      const roles = rolesByPlayer(state) as RoleId[];
      const deltas = scoreRound(roles, action.playerId, state.mode);
      return {
        ...state,
        phase: "VERDICT",
        accusedId: action.playerId,
        correct: isCorrectGuess(roles, action.playerId),
        deltas,
        totals: addTotals(state.totals, deltas),
      };
    }

    case "CONTINUE":
      switch (state.phase) {
        case "POLICE_CALL": return { ...state, phase: "ACCUSE" };
        case "VERDICT": return { ...state, phase: "SCORE" };
        case "SCORE":
          return { ...state, phase: state.round < state.totalRounds ? "INTERVAL" : "END" };
        default: return state;
      }

    case "NEXT_ROUND":
      return state.phase === "INTERVAL" ? freshRound(state, state.round + 1, action.chits) : state;

    case "PLAY_AGAIN":
      return { ...initialState, players: state.players, mode: state.mode, totalRounds: state.totalRounds };
  }
}
