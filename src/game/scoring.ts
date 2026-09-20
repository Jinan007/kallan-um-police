import { LIMITS, RIGHT_GUESS, ROLES, WRONG_GUESS_MODES } from "../config/rules";
import type { RoleId, WrongGuessMode } from "../config/rules";

/** The first N roles in fill order. Police and Kallan are always included. */
export function rolesForCount(n: number): RoleId[] {
  if (n < LIMITS.minPlayers || n > LIMITS.maxPlayers) {
    throw new RangeError(`Player count must be ${LIMITS.minPlayers}-${LIMITS.maxPlayers}, got ${n}`);
  }
  return ROLES.slice(0, n).map((r) => r.id);
}

const pointsOf = (id: RoleId) => ROLES.find((r) => r.id === id)!.points;

/**
 * Round points for one player.
 * `correct` is whether the police accused the kallan.
 */
export function pointsForRole(role: RoleId, correct: boolean, mode: WrongGuessMode): number {
  if (role === "police") return correct ? RIGHT_GUESS.police : WRONG_GUESS_MODES[mode].police;
  if (role === "kallan") return correct ? RIGHT_GUESS.thief : WRONG_GUESS_MODES[mode].thief;
  return pointsOf(role);
}

/** Per-player deltas for one round. `roles[i]` is player i's role. */
export function scoreRound(roles: readonly RoleId[], accusedId: number, mode: WrongGuessMode): number[] {
  const correct = isCorrectGuess(roles, accusedId);
  return roles.map((role) => pointsForRole(role, correct, mode));
}

export function isCorrectGuess(roles: readonly RoleId[], accusedId: number): boolean {
  return roles[accusedId] === "kallan";
}

export function addTotals(totals: readonly number[], deltas: readonly number[]): number[] {
  return totals.map((t, i) => t + (deltas[i] ?? 0));
}

/** Indexes of everyone tied for the highest total. */
export function winnerIds(totals: readonly number[]): number[] {
  const best = Math.max(...totals);
  return totals.flatMap((t, i) => (t === best ? [i] : []));
}

/** Indexes of everyone tied for the lowest total. */
export function lastPlaceIds(totals: readonly number[]): number[] {
  const worst = Math.min(...totals);
  return totals.flatMap((t, i) => (t === worst ? [i] : []));
}
