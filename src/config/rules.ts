export type RoleId =
  | "police" | "kallan" | "raja" | "rani" | "mantri"
  | "pattalam" | "vakkeel" | "chettan" | "chechi" | "kunju";

export interface RoleDef {
  id: RoleId;
  /** Points every round, except police and kallan, whose points depend on the verdict. */
  points: number;
}

/** Fill order: N players use the first N roles. Police and Kallan are always in. */
export const ROLES: readonly RoleDef[] = [
  { id: "police", points: 500 },
  { id: "kallan", points: 0 },
  { id: "raja", points: 1000 },
  { id: "rani", points: 700 },
  { id: "mantri", points: 600 },
  { id: "pattalam", points: 400 },
  { id: "vakkeel", points: 300 },
  { id: "chettan", points: 200 },
  { id: "chechi", points: 200 },
  { id: "kunju", points: 100 },
];

/** Police right guess: police 500, thief 0. */
export const RIGHT_GUESS = { police: 500, thief: 0 } as const;

/** Wrong-guess modes, chosen in SETUP. */
export const WRONG_GUESS_MODES = {
  STEAL: { police: 0, thief: 500 },
  PENALTY: { police: -500, thief: 500 },
} as const;

export type WrongGuessMode = keyof typeof WRONG_GUESS_MODES;
export const DEFAULT_MODE: WrongGuessMode = "STEAL";

export const LIMITS = {
  minPlayers: 4,
  maxPlayers: 10,
  defaultRounds: 5,
  minRounds: 1,
  maxRounds: 15,
  maxNameLength: 14,
} as const;

export const TIMINGS = {
  suspenseMs: 1500,
} as const;

export const STORAGE_KEY = "kallan-um-police:v1";

