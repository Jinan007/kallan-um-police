import type { RoleId, WrongGuessMode } from "./rules";

export const S = {
  appTitle: "Kallan um Police",
  tagline: "Chittu kuluki, kallane pidikku!",

  setup: {
    heading: "Kaliyilekku swagatham",
    playersLabel: "Aarokke kalikkunnu?",
    playerPlaceholder: (n: number) => `Kalikkaran ${n}`,
    addPlayer: "Oraale koodi cherkku",
    removePlayer: "Maattu",
    roundsLabel: "Ethra round?",
    modeLabel: "Thettiya pidikku aanel?",
    start: "Kali thudangatte",
    needMore: (min: number) => `Kurachu ${min} perenkilum venam, ketto`,
    duplicate: "Pere randu thavana? Vere peru idu",
  },

  modes: {
    FIXED: { title: "Fixed", desc: "Thettiyal Police 0, Kallan 500" },
    STEAL: { title: "Steal", desc: "Police-nte 500 Kallan eduthu poyi" },
    PENALTY: { title: "Penalty", desc: "Thettiyal Police -500, Kallan 500" },
  } satisfies Record<WrongGuessMode, { title: string; desc: string }>,

  shuffle: {
    heading: (r: number, total: number) => `Round ${r}/${total}`,
    body: "Chittu ellam kuluki, mesha-mel ittu",
    button: "Chittu kuluki idu",
  },

  pick: {
    cover: (name: string) => `Phone ${name}-nu kodukku`,
    coverHint: "Mattullavar nokkaruthu, ketto!",
    ready: "Njan aanu, phone thaa",
    chooseChit: (name: string) => `${name}, oru chit edukku`,
  },

  reveal: {
    hold: "Pidichu vechal chit thurakkum",
    holding: "Vittal chit chuttum",
    done: "Kandu, adutha aalkku kodukkaam",
    youAre: "Ninte role",
  },

  policeCall: {
    heading: "Police vilikkunnu!",
    isPolice: (name: string) => `${name} aanu Police`,
    next: "Kallane pidikkan pokam",
  },

  accuse: {
    heading: (name: string) => `${name} Sir, aaraanu kallan?`,
    hint: "Oraale thirenjedukku",
    suspense: "Oru nimisham...",
  },

  verdict: {
    caught: "PIDICHU!",
    wrong: "THETTI!",
    caughtLine: (thief: string) => `${thief} thanne aanu kallan!`,
    wrongLine: (accused: string, thief: string) =>
      `${accused} alla, ${thief} aanu asli kallan!`,
    revealAll: "Ellarude chittu ithaa",
    next: "Score nokkaam",
  },

  score: {
    heading: (r: number) => `Round ${r} score`,
    total: "Aake",
    nextRound: "Adutha round",
    finish: "Result nokkaam",
  },

  interval: {
    heading: "ഇടവേള",
    body: "Chaya kudichittu varaam",
    next: "Thudaru",
  },

  end: {
    heading: "Kali theernnu",
    winner: (names: string) => `Jayichathu: ${names}`,
    last: (names: string) => `Nammude kalikkaran: ${names}`,
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
    points: (n: number) => `${n} point`,
    mute: "Sound off",
    unmute: "Sound on",
  },
} as const;
