import type { RoleId, WrongGuessMode } from "./rules";

/** Mostly English, with Manglish for the flavour. */
export const S = {
  appTitle: "Kallan um Police",
  tagline: "Shuffle the chits, catch the thief!",

  setup: {
    heading: "Let's play!",
    playersLabel: "Who's playing?",
    playerPlaceholder: (n: number) => `Player ${n}`,
    addPlayer: "Add a player",
    removePlayer: "Remove",
    roundsLabel: "How many rounds?",
    modeLabel: "If the Police guess wrong...",
    start: "Kali thudangatte!",
    needMore: (min: number) => `You need at least ${min} players`,
    duplicate: "Two players have the same name. Make them different",
  },

  modes: {
    FIXED: { title: "Fixed", desc: "Wrong guess: Police 0, Kallan 500" },
    STEAL: { title: "Steal", desc: "Kallan snatches the 500 the Police would have earned" },
    PENALTY: { title: "Penalty", desc: "Wrong guess: Police -500, Kallan 500" },
  } satisfies Record<WrongGuessMode, { title: string; desc: string }>,

  shuffle: {
    heading: (r: number, total: number) => `Round ${r} of ${total}`,
    body: "The chits are ready to be shuffled and thrown on the table.",
    button: "Shuffle the chits",
  },

  pick: {
    cover: (name: string) => `Phone ${name}-nu kodukku`,
    coverHint: "Everyone else, no peeking! Nokkaruthu!",
    ready: "I have the phone",
    chooseChit: (name: string) => `${name}, pick a chit`,
  },

  reveal: {
    hold: "Press and hold the chit to open it",
    holding: "Let go to fold it back",
    done: "Got it, pass the phone",
    youAre: "You are the",
    worth: (n: number) => `Worth ${n} points`,
    variable: "Points depend on the verdict",
  },

  policeCall: {
    heading: "Police is calling!",
    isPolice: (name: string) => `${name} is the Police`,
    next: "Go catch the thief",
  },

  accuse: {
    heading: (name: string) => `${name} Sir, who is the Kallan?`,
    hint: "Tap the player you suspect",
    suspense: "Wait for it...",
  },

  verdict: {
    caught: "PIDICHU!",
    wrong: "THETTI!",
    caughtLine: (thief: string) => `${thief} was the Kallan!`,
    wrongLine: (accused: string, thief: string) =>
      `Not ${accused}! ${thief} was the real Kallan!`,
    revealAll: "Everyone's chits",
    next: "See the score",
  },

  score: {
    heading: (r: number) => `Score after round ${r}`,
    total: "Total",
    round: "Round",
    nextRound: "Next round",
    finish: "See the final result",
    reset: "Reset game",
    resetAsk: "Reset the game and go back to setup? All scores will be lost.",
    resetYes: "Yes, reset",
    resetNo: "Keep playing",
  },

  interval: {
    heading: "ഇടവേള",
    sub: "Intermission",
    body: "Time for a chaya break!",
    next: "Continue",
  },

  end: {
    heading: "Game over",
    winner: (names: string) => `Winner: ${names}`,
    last: (names: string) => `Last place: ${names}`,
    finale: "ശുഭം",
    again: "Veendum kalikkam?",
  },

  roles: {
    police: "Police",
    kallan: "Kallan",
    raja: "Raja",
    rani: "Rani",
    mantri: "Mantri",
    pattalam: "Pattalam",
    vakkeel: "Vakkeel",
    chettan: "Chettan",
    chechi: "Chechi",
    kunju: "Kunju",
  } satisfies Record<RoleId, string>,

  common: {
    points: (n: number) => `${n} points`,
    mute: "Sound off",
    unmute: "Sound on",
  },
} as const;
