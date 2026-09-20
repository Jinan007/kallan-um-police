import { useEffect, useReducer, useState } from "react";
import { play, unlock } from "./audio/sound";
import { MOTION } from "./config/motion";
import { Shake } from "./components/fx/Shake";
import { Controls } from "./components/layout/Controls";
import { FilmLayer } from "./components/layout/FilmLayer";
import { dealChits } from "./game/deal";
import { loadState, saveState } from "./game/persist";
import { reducer } from "./game/reducer";
import type { GameState, Phase } from "./game/reducer";
import { Table } from "./components/chit/Table";
import { SetupScreen } from "./components/setup/SetupScreen";
import {
  AccusePhase, EndPhase, IntervalPhase, PickPhase, PolicePhase, RevealPhase,
  ScorePhase, ShufflePhase, VerdictPhase,
} from "./components/phases/Phases";

/** Phases played on the wooden table. The Table stays mounted across all of them. */
const TABLE_PHASES: readonly Phase[] = [
  "SETUP", "SHUFFLE", "PICK", "REVEAL", "POLICE_CALL", "ACCUSE", "VERDICT", "SCORE", "INTERVAL", "END",
];

/** Seed for chit placement: same round and player count always lands the same way. */
const tableSeed = (s: GameState) => s.round * 100 + s.players.length;

const FILM_KEY = "kallan-um-police:film";
const readFilm = () => {
  try {
    return localStorage.getItem(FILM_KEY) !== "0"; // on unless switched off
  } catch {
    return true;
  }
};

export default function App() {
  const [s, send] = useReducer(reducer, undefined, loadState);
  const [film, setFilm] = useState(readFilm);
  const changeFilm = (on: boolean) => {
    setFilm(on);
    try {
      localStorage.setItem(FILM_KEY, on ? "1" : "0");
    } catch {
      /* not persisted */
    }
  };


  useEffect(() => saveState(s), [s]);

  // Browsers only allow audio after a tap: start the engine on the first one.
  useEffect(() => {
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  // One click sound for every button in the game, however deep in the tree. It listens for the
  // press on the document, so new buttons get it for free. Chits and the wheel hub have their own
  // sounds and opt out with data-silent.
  useEffect(() => {
    const onPress = (e: PointerEvent) => {
      const b = (e.target as Element | null)?.closest("button");
      if (b && !b.disabled && !b.dataset.silent) play("click");
    };
    document.addEventListener("pointerdown", onPress, true);
    return () => document.removeEventListener("pointerdown", onPress, true);
  }, []);

  // The whole table jolts on the badge slam and the verdict stamp, in step with the screen.
  const impact = s.phase === "POLICE_CALL" || s.phase === "VERDICT";
  const impactAt = s.phase === "POLICE_CALL" ? MOTION.policeBadge.shakeDelaySec : MOTION.stamp.landSec * 0.65;

  return (
    <>
      {film && <FilmLayer />}
      <Controls film={film} onFilm={changeFilm} />
      {TABLE_PHASES.includes(s.phase) && (
        <Shake className="fixed inset-0 z-0" active={impact} at={impactAt}>
          {/* key: a new round mounts a fresh table so the chits drop in again */}
          <Table
            key={s.round}
            count={s.phase === "SETUP" ? 0 : s.players.length} // setup shows the bare table
            seed={tableSeed(s)}
            owners={s.owners}
            phase={s.phase}
            pickIdx={s.pickIdx}
            onShuffleDone={() => send({ type: "SHUFFLE_DONE" })}
            onPick={(slot) => send({ type: "TAP_CHIT", slot })}
          />
        </Shake>
      )}
      <Phase s={s} send={send} />
    </>
  );
}

function Phase({ s, send }: { s: GameState; send: React.Dispatch<Parameters<typeof reducer>[1]> }) {
  switch (s.phase) {
    case "SETUP":
      return (
        <SetupScreen
          initialNames={s.players}
          initialRounds={s.totalRounds}
          initialMode={s.mode}
          onStart={(players, totalRounds, mode) =>
            send({ type: "START", players, totalRounds, mode, chits: dealChits(players.length) })
          }
        />
      );
    case "SHUFFLE": return <ShufflePhase s={s} />;
    case "PICK": return <PickPhase s={s} />;
    case "REVEAL": return <RevealPhase s={s} send={send} />;
    case "POLICE_CALL": return <PolicePhase s={s} send={send} />;
    case "ACCUSE": return <AccusePhase s={s} send={send} />;
    case "VERDICT": return <VerdictPhase s={s} send={send} />;
    case "SCORE": return <ScorePhase s={s} send={send} />;
    case "INTERVAL":
      return <IntervalPhase s={s} onNext={() => send({ type: "NEXT_ROUND", chits: dealChits(s.players.length) })} />;
    case "END": return <EndPhase s={s} send={send} />;
  }
}
