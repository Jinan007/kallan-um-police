# Kallan um Police - project notes

Pass-and-play paper-chit game (Kerala, 90s film look). Vite + React + TS, Tailwind v4, Motion (`motion/react`), Howler, canvas-confetti. No backend.

## Decisions
- **Rules live only in `src/config/rules.ts`**; all copy in `src/config/strings.ts` (Manglish). No rules or text in components.
- **Scoring is pure** (`src/game/scoring.ts`, Vitest). Deal/shuffle takes an injectable RNG (`deal.ts`).
- **State machine** = `useReducer` in `src/game/reducer.ts`. The reducer is pure: random chits are dealt in the UI and passed in the `START` / `NEXT_ROUND` action payload. Invalid-phase actions return the same state object.
- Player id = index in `players`. Chit slot = index in `chits`; `owners[slot]` = player id.
- **Modes:** FIXED (default) and STEAL both give the thief 500 and police 0 on a wrong guess (owner's call: STEAL = "thief takes the round's 500", numerically same as FIXED, kept as a separate config entry). PENALTY: police -500, thief 500. Right guess: police 500, thief 0.
- Police cannot accuse themselves (reducer rejects it; UI hides them).
- Persisted to localStorage under `STORAGE_KEY` (versioned). Invalid saved state falls back to SETUP.
- Fonts via `@fontsource` (offline, no layout shift). Palette tokens in `src/index.css` `@theme`.
- Only animate `transform` and `opacity`; honour `prefers-reduced-motion`; tap feedback on `pointerdown`.

## Phases
- [x] P1 rules + state machine + plain UI (playable). Deferred bits are marked `TODO(P2..P4)` in `src/components/phases/Phases.tsx`.
- [ ] P2 shuffle / pick / reveal / verdict animations
- [ ] P3 film layer + audio + memes (meme files currently in `/image`, must move to `public/memes/<event>/`; `theif.jpg` is unused so far)
- [ ] P4 scoreboard handwriting + interval / end cards
- [ ] P5 polish

## Commands
`npm run dev -- --host` (test on phone) | `npm test` | `npm run build`

## P1 feedback round (owner)
- Copy is mostly English with Manglish flavour (headings like "Phone <name>-nu kodukku", "Veendum kalikkam?").
- Scoreboard writes rounds downwards (`history[round][player]`, `ScoreSheet.tsx`) with a totals row. P4 adds pen-stroke handwriting on top.
- `RESET` action (also used by PLAY_AGAIN) is offered on every SCORE screen behind a confirm; it keeps names and settings.
- Bug fixed: `Paper` dropped event props, so press-and-hold never fired and roles never showed.
- Still P2: 3D scatter / pick / unroll. Still P3: memes.

## P2 (animations) - done
- All timings/sizes in `src/config/motion.ts`. Chit placement is a seeded jittered grid (`components/chit/slots.ts`), so it is stable across re-renders/refresh.
- `Table.tsx`: tilted wooden plane (CSS perspective + rotateX). Shuffle stages appear -> roll -> shake -> scatter driven by timeouts; chits move with x/y/rotate/opacity only. Tap lifts the chit (z + scale) 260ms, then TAP_CHIT.
- `ChitUnroll.tsx`: 5 nested strips, each hinged at its top edge (real scroll unroll). Folded strips accumulate rotation and would face the viewer, so each face fades out with opacity (on the face only; opacity on a strip would flatten the 3D chain). Starts folded so the role never flashes.
- `fx/`: Badge (slam), Stamp (verdict), Shake (screen shake). Accuse = fixed spotlight overlay + 1.5s jitter, then ACCUSE dispatch.
- Reduced motion: durations go to 0 / shake skipped.
- Sound hooks are `TODO(P3)` comments in Phases.tsx.
