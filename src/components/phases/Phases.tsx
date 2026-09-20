import { useState } from "react";
import { S } from "../../config/strings";
import { policeId, rolesByPlayer, thiefId } from "../../game/reducer";
import type { GameState } from "../../game/reducer";
import { winnerIds, lastPlaceIds } from "../../game/scoring";
import { useHold } from "../../hooks/useHold";
import { Button } from "../layout/Button";
import { Paper, Screen } from "../layout/Screen";

interface Send {
  send: (a: import("../../game/reducer").Action) => void;
}
type P = { s: GameState } & Send;

export function ShufflePhase({ s, send }: P) {
  return (
    <Screen title={S.shuffle.heading(s.round, s.totalRounds)}>
      {/* TODO(P2): torn-paper chits rolled, shaken and scattered onto the table */}
      <Paper><p className="text-lg">{S.shuffle.body}</p></Paper>
      <Button onClick={() => send({ type: "SHUFFLE_DONE" })}>{S.shuffle.button}</Button>
    </Screen>
  );
}

export function PickPhase({ s, send }: P) {
  const [ready, setReady] = useState(false);
  const name = s.players[s.pickIdx];

  if (!ready) {
    return (
      <Screen>
        <Paper className="mt-8 text-center">
          <h1 className="font-display text-3xl font-bold">{S.pick.cover(name)}</h1>
          <p className="mt-2 font-ml">{S.pick.coverHint}</p>
        </Paper>
        <Button onClick={() => setReady(true)}>{S.pick.ready}</Button>
      </Screen>
    );
  }
  return (
    <Screen title={S.pick.chooseChit(name)}>
      <div className="grid grid-cols-3 gap-3">
        {s.chits.map((_, slot) => {
          const taken = s.owners[slot] !== null;
          return (
            <button
              key={slot}
              disabled={taken}
              aria-label={`Chit ${slot + 1}`}
              onClick={() => {
                setReady(false);
                send({ type: "TAP_CHIT", slot });
              }}
              className="paper aspect-[3/4] rounded-md font-display text-2xl font-bold transition-transform duration-100 active:scale-95 disabled:opacity-20"
            >
              {slot + 1}
            </button>
          );
        })}
      </div>
    </Screen>
  );
}

export function RevealPhase({ s, send }: P) {
  const { held, bind } = useHold();
  const slot = s.pickedSlot!;
  const role = s.chits[slot];
  return (
    <Screen title={s.players[s.pickIdx]}>
      {/* TODO(P2): CSS 3D unroll, paper segments rotating on the X axis */}
      <Paper
        {...bind}
        className="flex min-h-56 touch-none flex-col items-center justify-center text-center"
      >
        {held ? (
          <>
            <p className="font-ml">{S.reveal.youAre}</p>
            <p className="font-display text-5xl font-bold text-stamp">{S.roles[role]}</p>
          </>
        ) : (
          <p className="font-display text-xl font-bold">{S.reveal.hold}</p>
        )}
      </Paper>
      <Button disabled={held} onClick={() => send({ type: "PEEK_DONE" })}>{S.reveal.done}</Button>
    </Screen>
  );
}

export function PolicePhase({ s, send }: P) {
  return (
    <Screen title={S.policeCall.heading}>
      {/* TODO(P2): badge slam, screen shake, stamp sound */}
      <Paper className="text-center">
        <p className="font-display text-3xl font-bold text-stamp">
          {S.policeCall.isPolice(s.players[policeId(s)])}
        </p>
      </Paper>
      <Button onClick={() => send({ type: "CONTINUE" })}>{S.policeCall.next}</Button>
    </Screen>
  );
}

export function AccusePhase({ s, send }: P) {
  const police = policeId(s);
  return (
    <Screen title={S.accuse.heading(s.players[police])}>
      {/* TODO(P2): spotlight, drumroll and a 1.5s suspense beat (TIMINGS.suspenseMs) */}
      <p className="font-ml">{S.accuse.hint}</p>
      <div className="flex flex-col gap-3">
        {s.players.map((name, id) =>
          id === police ? null : (
            <Button key={id} variant="ghost" onClick={() => send({ type: "ACCUSE", playerId: id })}>
              {name}
            </Button>
          ),
        )}
      </div>
    </Screen>
  );
}

export function VerdictPhase({ s, send }: P) {
  const roles = rolesByPlayer(s);
  const thief = s.players[thiefId(s)];
  const accused = s.players[s.accusedId!];
  return (
    <Screen>
      {/* TODO(P2): rubber-stamp animation. TODO(P3): meme reaction */}
      <Paper className="text-center">
        <p className={`font-display text-5xl font-bold ${s.correct ? "text-ink" : "text-stamp"}`}>
          {s.correct ? S.verdict.caught : S.verdict.wrong}
        </p>
        <p className="mt-2 font-ml">
          {s.correct ? S.verdict.caughtLine(thief) : S.verdict.wrongLine(accused, thief)}
        </p>
      </Paper>
      <Paper>
        <h2 className="font-display text-lg font-bold">{S.verdict.revealAll}</h2>
        <ul className="mt-1">
          {s.players.map((name, i) => (
            <li key={i} className="flex justify-between">
              <span>{name}</span>
              <span className="font-bold">{roles[i] ? S.roles[roles[i]!] : "-"}</span>
            </li>
          ))}
        </ul>
      </Paper>
      <Button onClick={() => send({ type: "CONTINUE" })}>{S.verdict.next}</Button>
    </Screen>
  );
}

export function ScorePhase({ s, send }: P) {
  const last = s.round >= s.totalRounds;
  return (
    <Screen title={S.score.heading(s.round)}>
      {/* TODO(P4): SVG pen-stroke handwriting onto the ruled scoreboard */}
      <Paper>
        <table className="w-full text-lg">
          <thead>
            <tr className="text-left font-display">
              <th>&nbsp;</th><th className="text-right">+/-</th><th className="text-right">{S.score.total}</th>
            </tr>
          </thead>
          <tbody>
            {s.players.map((name, i) => (
              <tr key={i}>
                <td>{name}</td>
                <td className="text-right">{s.deltas[i] > 0 ? `+${s.deltas[i]}` : s.deltas[i]}</td>
                <td className="text-right font-bold">{s.totals[i]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Paper>
      <Button onClick={() => send({ type: "CONTINUE" })}>{last ? S.score.finish : S.score.nextRound}</Button>
    </Screen>
  );
}

export function IntervalPhase({ onNext }: { onNext: () => void }) {
  return (
    <Screen>
      {/* TODO(P4): projector-style ഇടവേള title card */}
      <Paper className="mt-10 text-center">
        <h1 className="font-ml text-5xl font-bold">{S.interval.heading}</h1>
        <p className="mt-2">{S.interval.body}</p>
      </Paper>
      <Button onClick={onNext}>{S.interval.next}</Button>
    </Screen>
  );
}

export function EndPhase({ s, send }: P) {
  const names = (ids: number[]) => ids.map((i) => s.players[i]).join(", ");
  return (
    <Screen title={S.end.heading}>
      {/* TODO(P4): winner reveal, confetti, loser meme, ശുഭം end card */}
      <Paper className="text-center">
        <p className="font-display text-2xl font-bold">{S.end.winner(names(winnerIds(s.totals)))}</p>
        <p className="mt-2 font-ml">{S.end.last(names(lastPlaceIds(s.totals)))}</p>
        <p className="mt-4 font-ml text-4xl">{S.end.finale}</p>
      </Paper>
      <Paper>
        <ul>
          {s.players.map((name, i) => (
            <li key={i} className="flex justify-between">
              <span>{name}</span><span className="font-bold">{s.totals[i]}</span>
            </li>
          ))}
        </ul>
      </Paper>
      <Button onClick={() => send({ type: "PLAY_AGAIN" })}>{S.end.again}</Button>
    </Screen>
  );
}
