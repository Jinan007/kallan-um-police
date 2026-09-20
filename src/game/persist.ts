import { STORAGE_KEY, WRONG_GUESS_MODES } from "../config/rules";
import type { GameState, Phase } from "./reducer";
import { initialState } from "./reducer";

const PHASES: Phase[] = [
  "SETUP", "SHUFFLE", "PICK", "REVEAL", "POLICE_CALL", "ACCUSE", "VERDICT", "SCORE", "INTERVAL", "END",
];

function looksValid(x: unknown): x is GameState {
  const s = x as GameState;
  return (
    !!s &&
    PHASES.includes(s.phase) &&
    Array.isArray(s.players) &&
    Array.isArray(s.chits) &&
    Array.isArray(s.owners) &&
    Array.isArray(s.totals) &&
    Array.isArray(s.history) &&
    s.mode in WRONG_GUESS_MODES && // drops saved games from before a mode was removed
    typeof s.round === "number"
  );
}

export function loadState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const parsed: unknown = JSON.parse(raw);
    return looksValid(parsed) ? parsed : initialState;
  } catch {
    return initialState;
  }
}

export function saveState(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* private mode or quota: the game still works, it just won't survive a refresh */
  }
}
