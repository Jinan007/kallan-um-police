# Kallan um Police

Pass-and-play digital version of the Kerala paper-chit game. One phone, 4-10 players.

## Run
```bash
npm install
npm run dev -- --host   # open the printed Network URL on your phone (same Wi-Fi)
npm test                # scoring + state machine tests (Vitest)
npm run build           # production build to dist/
```

## Deploy
Import the repo in Vercel. Framework preset: Vite (auto-detected), build `npm run build`, output `dist`.

## Rules
All points, roles and wrong-guess modes are in `src/config/rules.ts`; all text is in `src/config/strings.ts`.
See `CLAUDE.md` for design decisions and phase status.
