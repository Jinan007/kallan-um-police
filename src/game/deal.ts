import type { RoleId } from "../config/rules";
import { rolesForCount } from "./scoring";

export type Rng = () => number;

/** Fisher-Yates. Pass a seeded `rng` in tests. Never mutates the input. */
export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** One shuffled chit per player: slot index -> role. */
export function dealChits(playerCount: number, rng: Rng = Math.random): RoleId[] {
  return shuffle(rolesForCount(playerCount), rng);
}
