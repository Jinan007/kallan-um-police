import { useEffect, useReducer } from "react";
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
const TABLE_PHASES: readonly Phase[] = ["SHUFFLE", "PICK", "REVEAL", "POLICE_CALL", "ACCUSE", "VERDICT"];

/** Seed for chit placement: same round and player count always lands the same way. */
const tableSeed = (s: GameState) => s.round * 100 + s.players.length;

export default function App() {
  const [s, send] = useReducer(reducer, undefined, loadState);

  useEffect(() => saveState(s), [s]);

  return (
    <>
      {TABLE_PHASES.includes(s.phase) && (
        <div className="fixed inset-0 z-0">
          <Table
            count={s.players.length}
            seed={tableSeed(s)}
            owners={s.owners}
            phase={s.phase}
            pickIdx={s.pickIdx}
            onShuffleDone={() => send({ type: "SHUFFLE_DONE" })}
            onPick={(slot) => send({ type: "TAP_CHIT", slot })}
          />
        </div>
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
      return <IntervalPhase onNext={() => send({ type: "NEXT_ROUND", chits: dealChits(s.players.length) })} />;
    case "END": return <EndPhase s={s} send={send} />;
  }
}
