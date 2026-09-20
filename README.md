# Kallan um Police

A pass-and-play digital version of the Kerala paper-chit game. One phone, 4 to 10 players.
Everyone draws a crumpled paper chit, the Police finds the Kallan (thief), and points are
written onto a notebook scoreboard. Built to feel like an old Malayalam film print.

**Stack:** Vite, React, TypeScript, Tailwind CSS v4, Motion (`motion/react`), Howler.js,
canvas-confetti, Vitest. No backend, no accounts: the whole game runs in the browser.

## Run it

You need Node 20 or newer.

```bash
npm install
npm run dev -- --host   # open the printed Network URL on your phone (same Wi-Fi)
```

| Command | What it does |
|---|---|
| `npm run dev -- --host` | Dev server, reachable from your phone |
| `npm test` | Unit tests (scoring, state machine, dares, suspense timing) |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run noise` | Re-generate the film-grain image `public/img/noise.png` |

## Deploy (Vercel)

1. Push the repo to GitHub.
2. In Vercel choose **Add New, Project**, and import the repo.
3. Leave the defaults: framework **Vite**, build command `npm run build`, output `dist`.
4. Deploy. Every push to `main` redeploys automatically.

## How a round plays

1. **Setup** (first round): enter 4 to 10 names, choose the number of rounds, and optionally edit the wheel of dares.
2. **Shuffle:** chits drop onto a wooden table, crumple into paper balls, shake and scatter.
3. **Pick:** each player in turn is named at the top. Drag chits around if you like, then tap one.
4. **Reveal (private):** press and hold the paper ball to open it and see your role and points. Let go and it folds back.
5. **Police call:** the Police is revealed with a badge slam and a screen shake.
6. **Accuse:** the Police taps one player. Drumroll, heartbeat, suspense.
7. **Verdict:** a rubber stamp says PIDICHU! (right) or THETTI! (wrong). Every chit is revealed with the points earned.
8. **Score:** the round's points are handwritten onto the notebook scoreboard, with running totals.
9. **Intermission** (ഇടവേള) between rounds. After the last round: winner celebration, the **wheel of dares** for last place, and the ശുഭം end card, then "Veendum kalikkam?" to play again.

The game is saved as you play, so an accidental refresh does not lose it.

## Rules

Roles are used in this order, so N players use the first N (Police and Kallan are always in):

| Role | Points |
|---|---|
| Police | 500 if the guess is right, otherwise 0 |
| Kallan | 0 if caught, otherwise 500 |
| Raja | 1000 |
| Rani | 700 |
| Mantri | 600 |
| Pattalam | 400 |
| Vakkeel | 300 |
| Chettan | 200 |
| Chechi | 200 |
| Kunju | 100 |

Every other role scores its points whatever the verdict. The Police cannot accuse themselves.

## Where things live

- **Rules and numbers:** `src/config/rules.ts` (roles, points, limits, timings). Nothing about the rules is hardcoded in components.
- **All text:** `src/config/strings.ts` (English with Manglish flavour).
- **Animation timings and sizes:** `src/config/motion.ts`.
- **Wheel dares (defaults):** `src/config/dares.ts`. Players can also edit them in the game (saved on that phone).
- **Game logic (no React):** `src/game/` holds scoring, dealing, the state machine (`reducer.ts`), saving, and their tests.
- **Sound:** `src/audio/sound.ts`.
- **Decisions and history:** `CLAUDE.md`.

The game flow is an explicit state machine (`useReducer`):
`SETUP > SHUFFLE > PICK > REVEAL > POLICE_CALL > ACCUSE > VERDICT > SCORE > INTERVAL or END`.

## Sound

Every effect works out of the box: if a sound file is missing, a synthesized version plays instead.
To use your own sounds, put `.mp3` files in `public/sfx/` with the names listed in
`public/sfx/README.txt` (shake, toss, drumroll, stamp, crinkle, whirr, win, spin, tick, pen, click).
Sound starts after the first tap, and the speaker button (top right) mutes it. On an iPhone, also
check the ringer switch is not on silent.

## Good to know

- **Film look:** grain, vignette, occasional scratch and flicker. The film-strip button (top right) turns it off. With reduced motion on, only the still grain and vignette remain.
- **Reduced motion:** respected everywhere; animations shorten or switch off.
- **Screen stays awake** during a game on phones that support it.
- **If something breaks,** a friendly "Start over" card appears instead of a blank screen.
- Best on a phone in portrait. It works on desktop too, in a narrow centered column.
