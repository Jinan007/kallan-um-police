import { useEffect, useReducer } from "react";
import { dealChits } from "./game/deal";
import { loadState, saveState } from "./game/persist";
import { reducer } from "./game/reducer";
import { SetupScreen } from "./components/setup/SetupScreen";
import {
  AccusePhase, EndPhase, IntervalPhase, PickPhase, PolicePhase, RevealPhase,
  ScorePhase, ShufflePhase, VerdictPhase,
} from "./components/phases/Phases";

export default function App() {
  const [s, send] = useReducer(reducer, undefined, loadState);

  useEffect(() => saveState(s), [s]);

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
    case "SHUFFLE": return <ShufflePhase s={s} send={send} />;
    // key: remount per player so the cover screen shows again for each one
    case "PICK": return <PickPhase key={s.pickIdx} s={s} send={send} />;
    case "REVEAL": return <RevealPhase s={s} send={send} />;
    case "POLICE_CALL": return <PolicePhase s={s} send={send} />;
    case "ACCUSE": return <AccusePhase s={s} send={send} />;
    case "VERDICT": return <VerdictPhase s={s} send={send} />;
    case "SCORE": return <ScorePhase s={s} send={send} />;
    case "INTERVAL":
      return <IntervalPhase onNext={() => send({ type: "NEXT_ROUND", chits: dealChits(s.players.length) })} />;
    case "END": return <EndPhase s={s} send={send} />;
  }
}
