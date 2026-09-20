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

## P2 feedback round (owner)
- Everything centred: `Screen` wraps content in a `my-auto` column with `text-center` (my-auto, not justify-center, so tall content scrolls from the top). `tone="table"` = walnut room for shuffle/pick.
- **FIXED mode removed** (it was identical to STEAL). Modes: STEAL (default) and PENALTY. Saved games with an unknown mode are discarded by `persist.ts`.
- Table: plank grain via SVG fractal-noise data-URI in `index.css` (`.wood-top`, `.wood-room`), painted once; only the parent is transformed.
- Chits are crumpled paper balls (`chit/crumple.ts` draws them on a canvas once per seed, cached as data URLs). Reveal = `CrumpleOpen.tsx`: ball swells and fades, wrinkled sheet grows with a 3D wobble, crease overlay relaxes, text fades in last. Replaces the nested-strip scroll (`ChitUnroll`, deleted).
- Chits are draggable while picking (`Table.tsx`, own pointer handling on motion values; 8px threshold separates tap from drag; vertical drag is divided by cos(tilt) to compensate for the tilted plane). Dragged positions persist for the round in module state `dragged`.
- End screen: `fx/Celebration.tsx` (trophy spring, rotating rays, sparkles, canvas-confetti loaded on demand) and `fx/DareWheel.tsx` (last place spins; winning wedge chosen first, spin aimed so it stops under the top pointer). Dares live in `config/dares.ts`.

## P2 feedback round 2 (owner)
- **No cover page.** "Phone X-nu kodukku" is gone; the title "<name>, pick a chit" is the hand-off.
- **Persistent table.** `App` mounts `Table` once behind SHUFFLE..VERDICT (`TABLE_PHASES`). Phases render `Screen tone="table"`: a fixed, `pointer-events-none` translucent scrim (`scrim-light` on pick, `scrim-dim` elsewhere) so the table and the remaining balls stay visible; controls opt back in with `pointer-events-auto` (Button, Paper, hold area).
- **Per-turn reshuffle.** Each new pick turn (pickIdx > 0) plays gather -> shake -> scatter (`MOTION.turn`); new positions come from `slotSeed` (changed only at the scatter step so nothing jumps early). Dragged positions therefore last one turn.
- **More 3D.** Deeper perspective + tilt (32deg), fog toward the far end, a front edge folded down for thickness, plank grain. Balls are counter-tilted (`rotateX(-tilt)` around their base) so they stand up, with a flat contact shadow. Ball textures have more facet contrast and no baked shadow.
- Layers use `initial={false}` so nothing flashes at its start state when the table mounts mid-game.
- **Dare wheel**: `game/dares.ts` (sanitize/load/save, tested), editable in-game (label max 10 chars, 3-14 dares, saved to localStorage `kallan-um-police:dares:v1`, reset to defaults). Wheel drawing is `WheelDisc` (rim lights, gloss, hub); defaults in `config/dares.ts`.
- Testing note: the browser pane throttles animations when hidden (`document.visibilityState === "hidden"`); front the tab before judging motion.

## Round 3 fixes (owner)
- Root cause of invisible text (role points, suspense name, "Winner"): screens on the table use light text, and text on paper inherited it. `.paper { color: ink }` in `index.css` fixes it everywhere. Any new paper-like surface must use the `paper` class.
- SCORE, INTERVAL and END also sit on the table (`TABLE_PHASES`); `Table` is keyed by round so a new round drops the chits in again.
- Verdict list shows each player's role and the points earned that round.
- Dare wheel: the hub is the spin button (round, 27% of the wheel, does not rotate); the separate Spin button is gone.

## Update: no reshuffle between picks (owner)
- The per-turn gather/shake/scatter was removed. After the initial shuffle the chits stay put between turns (dragged positions persist for the round); only the picked chit leaves. This supersedes the "Per-turn reshuffle" note above.

## Suspense, shake and sound (owner)
- **Audio engine** (`src/audio/sound.ts`): starts on the first tap. Each sound plays `/public/sfx/<name>.mp3` if that file exists (checked with a HEAD request; the type must be audio, because a missing file often returns index.html with 200), otherwise a synthesized Web Audio stand-in. Names: `shake`, `toss`, `drumroll`, `stamp`. Mute toggle top-right (`MuteToggle`), remembered in localStorage. Still to supply/add: crinkle, whirr, BGM (P3).
- **Suspense** (`fx/SuspenseOverlay.tsx`, `game/suspense.ts`): `TIMINGS.suspenseMs` is now 2600. A dark tunnel closes in, the card swells and thumps on accelerating heartbeats, jitter grows then stops for the last beat, snare roll + heartbeat sound on the same beat times, text changes twice. Beat times are pure and tested.
- **Shake corners fix:** the screen scrim extends 40px past the edges (`-inset-10`), the body colour matches the table room, and the table backdrop shakes with the content (`Shake` with `active`), so no gaps appear at the corners.
- **Shuffle shake:** the pile wobbles as a whole and every ball also spins, hops and jitters out of step (`stage === "shake"` in `Table.tsx`). Sounds: toss on drop, rattle on shake, toss on scatter, stamp on badge slam and verdict.

## P3 (film layer, memes, audio) - done
- **Film layer** (`layout/FilmLayer.tsx`, CSS in `index.css`): grain = pre-rendered `public/img/noise.png` (made by `npm run noise`, plain Node PNG writer) on an oversized layer slid with a stepped transform; static vignette; a scratch every 6-14s and a flicker every 4-11s (random timers). Reduced motion keeps only vignette + still grain. Toggle (film icon, top right) is remembered under `kallan-um-police:film`.
- **Memes**: images live in `public/memes/<event>/`; `scripts/build-memes.mjs` (runs as `predev`/`prebuild`) writes `public/memes/manifest.json`; `memes/memes.ts` picks one at random per mount and preloads for the next phase. `fx/MemeFrame.tsx` = polaroid with mount corners + torn caption; styled placeholder if a folder is empty. Events: police_reveal (police call), caught (verdict, right), wrong_accuse + escaped (verdict, wrong: two frames), king_reveal (winner), last_place (loser).
- `unused-assets/theif.jpg` is deliberately not wired in (see chat: real person shown as a thief).
- **Audio** additions: crinkle (chit opens/closes), whirr (interval), generative BGM (drone + raga plucks with echo) or `/sfx/bgm.mp3` if present; music pauses when the tab is hidden. File names are listed in `public/sfx/README.txt`.

## Update: no meme images (owner)
- All meme photos were removed from the repo (they showed real people). `MemeFrame` now shows an old-film title card (icon + caption, no photo) when an event folder has no image. Adding your own image to `public/memes/<event>/` still works and is used automatically. `theif.jpg` is gone too. Note: the deleted photos still exist in earlier git commits.
