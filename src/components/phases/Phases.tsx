import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { MOTION } from "../../config/motion";
import { ROLES, TIMINGS } from "../../config/rules";
import { S } from "../../config/strings";
import { policeId, rolesByPlayer, thiefId } from "../../game/reducer";
import type { GameState } from "../../game/reducer";
import { winnerIds, lastPlaceIds } from "../../game/scoring";
import { haptic, useHold } from "../../hooks/useHold";
import { CrumpleOpen } from "../chit/CrumpleOpen";
import { Badge } from "../fx/Badge";
import { Celebration } from "../fx/Celebration";
import { DareWheel } from "../fx/DareWheel";
import { Shake } from "../fx/Shake";
import { Stamp } from "../fx/Stamp";
import { Button } from "../layout/Button";
import { Paper, Screen } from "../layout/Screen";
import { ScoreSheet } from "./ScoreSheet";

interface Send {
  send: (a: import("../../game/reducer").Action) => void;
}
type P = { s: GameState } & Send;

/** The table itself is mounted by App; these phases only add a layer of text on top of it. */
export function ShufflePhase({ s }: { s: GameState }) {
  return (
    <Screen tone="table" scrim="light" title={S.shuffle.heading(s.round, s.totalRounds)}>
      {/* TODO(P3): paper crinkle and chit toss sounds */}
    </Screen>
  );
}

export function PickPhase({ s }: { s: GameState }) {
  return (
    <Screen tone="table" scrim="light" title={S.pick.chooseChit(s.players[s.pickIdx])}>
      <span className="sr-only">{S.pick.hint}</span>
    </Screen>
  );
}

export function RevealPhase({ s, send }: P) {
  const { held, bind } = useHold();
  const role = s.chits[s.pickedSlot!];
  const fixed = role === "police" || role === "kallan";
  const content = (
    <div className="flex h-full flex-col items-center justify-center px-3 text-center">
      <p className="font-ml">{S.reveal.youAre}</p>
      <p className="font-display text-5xl font-bold text-stamp">{S.roles[role]}</p>
      <p className="mt-2 font-hand text-lg">
        {fixed ? S.reveal.variable : S.reveal.worth(ROLES.find((r) => r.id === role)!.points)}
      </p>
    </div>
  );
  return (
    <Screen tone="table" title={s.players[s.pickIdx]}>
      <div {...bind} className="pointer-events-auto touch-none rounded-lg py-2" style={{ WebkitTouchCallout: "none" }}>
        <CrumpleOpen open={held} content={content} seed={s.round * 31 + s.pickedSlot! * 7 + s.pickIdx} />
      </div>
      <p className="text-center font-display text-lg font-bold">
        {held ? S.reveal.holding : S.reveal.hold}
      </p>
      <Button disabled={held} onClick={() => send({ type: "PEEK_DONE" })}>{S.reveal.done}</Button>
    </Screen>
  );
}

export function PolicePhase({ s, send }: P) {
  const reduced = useReducedMotion();
  return (
    <Shake at={MOTION.policeBadge.shakeDelaySec}>
      <Screen tone="table" title={S.policeCall.heading}>
        <Paper className="pb-6 pt-6 text-center">
          <Badge label="POLICE" />
          <motion.p
            className="mt-4 font-display text-3xl font-bold text-stamp"
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: MOTION.policeBadge.slamSec, duration: 0.3 }}
          >
            {S.policeCall.isPolice(s.players[policeId(s)])}
          </motion.p>
          {/* TODO(P3): stamp thud sound on impact */}
        </Paper>
        <Button onClick={() => send({ type: "CONTINUE" })}>{S.policeCall.next}</Button>
      </Screen>
    </Shake>
  );
}

export function AccusePhase({ s, send }: P) {
  const reduced = useReducedMotion();
  const police = policeId(s);
  const [target, setTarget] = useState<number | null>(null);

  useEffect(() => {
    if (target === null) return;
    const id = window.setTimeout(() => send({ type: "ACCUSE", playerId: target }), TIMINGS.suspenseMs);
    return () => clearTimeout(id);
  }, [target, send]);

  return (
    <Screen tone="table" title={S.accuse.heading(s.players[police])}>
      <p className="font-ml">{S.accuse.hint}</p>
      <div className="flex flex-col gap-3">
        {s.players.map((name, id) =>
          id === police ? null : (
            <Button key={id} variant="ghost" disabled={target !== null} onClick={() => setTarget(id)}>
              {name}
            </Button>
          ),
        )}
      </div>

      {target !== null && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6"
          style={{ background: "radial-gradient(circle at 50% 45%, #6b4a22 0, #1a0f06 45%, #060302 80%)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {/* Spotlight: a dim layer with a bright radial hole. The card jitters faster as it swells. */}
          <motion.div
            className="paper rounded-lg px-8 py-6 text-center"
            initial={{ scale: 0.8 }}
            animate={
              reduced
                ? { scale: 1.1 }
                : { scale: [0.8, 1.25], x: [0, -3, 3, -4, 4, -2, 2, 0] }
            }
            transition={{
              scale: { duration: TIMINGS.suspenseMs / 1000, ease: "easeIn" },
              x: { duration: MOTION.suspense.jitterSec, repeat: Infinity },
            }}
            onAnimationStart={() => haptic(30)}
          >
            <p className="font-display text-4xl font-bold">{s.players[target]}</p>
          </motion.div>
          <p className="mt-10 font-ml text-xl text-paper">{S.accuse.suspense}</p>
          {/* TODO(P3): drumroll sound */}
        </motion.div>
      )}
    </Screen>
  );
}

export function VerdictPhase({ s, send }: P) {
  const reduced = useReducedMotion();
  const roles = rolesByPlayer(s);
  const thief = s.players[thiefId(s)];
  const accused = s.players[s.accusedId!];
  const st = MOTION.stamp;
  const fade = (delay: number) => ({
    initial: reduced ? false : { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.35 },
  });
  const endAt = st.listDelaySec + s.players.length * st.rowStaggerSec + 0.3;
  return (
    <Shake at={st.landSec * 0.65}>
      <Screen tone="table">
        <Paper className="pb-5 pt-6 text-center">
          <Stamp text={s.correct ? S.verdict.caught : S.verdict.wrong} tone={s.correct ? "blue" : "red"} />
          <motion.p className="mt-4 font-ml text-lg" {...fade(st.thiefDelaySec)}>
            {s.correct ? S.verdict.caughtLine(thief) : S.verdict.wrongLine(accused, thief)}
          </motion.p>
          {/* TODO(P3): meme reaction in a vintage photo frame */}
        </Paper>
        <Paper style={{ perspective: 700 }}>
          <h2 className="font-display text-lg font-bold">{S.verdict.revealAll}</h2>
          <ul className="mt-1">
            {s.players.map((name, i) => (
              <motion.li
                key={i}
                className="flex justify-between"
                style={{ transformOrigin: "top" }}
                initial={reduced ? false : { rotateX: -90, opacity: 0 }}
                animate={{ rotateX: 0, opacity: 1 }}
                transition={{ delay: st.listDelaySec + i * st.rowStaggerSec, duration: 0.3, ease: "easeOut" }}
              >
                <span>{name}</span>
                <span className="flex items-baseline gap-3">
                  <span className={`font-bold ${roles[i] === "kallan" ? "text-stamp" : ""}`}>
                    {roles[i] ? S.roles[roles[i]!] : "-"}
                  </span>
                  <span className={`w-14 text-right font-display ${s.deltas[i] < 0 ? "text-stamp" : ""}`}>
                    {s.deltas[i] > 0 ? `+${s.deltas[i]}` : s.deltas[i]}
                  </span>
                </span>
              </motion.li>
            ))}
          </ul>
        </Paper>
        <motion.div {...fade(endAt)}>
          <Button className="w-full" onClick={() => send({ type: "CONTINUE" })}>{S.verdict.next}</Button>
        </motion.div>
      </Screen>
    </Shake>
  );
}
export function ScorePhase({ s, send }: P) {
  const last = s.round >= s.totalRounds;
  const [confirming, setConfirming] = useState(false);
  return (
    <Screen tone="table" title={S.score.heading(s.round)}>
      {/* TODO(P4): SVG pen-stroke handwriting onto the ruled scoreboard */}
      <ScoreSheet s={s} />
      <Button onClick={() => send({ type: "CONTINUE" })}>{last ? S.score.finish : S.score.nextRound}</Button>
      {confirming ? (
        <Paper className="text-center">
          <p className="font-hand text-lg">{S.score.resetAsk}</p>
          <div className="mt-3 flex gap-3">
            <Button variant="ghost" className="flex-1" onClick={() => setConfirming(false)}>{S.score.resetNo}</Button>
            <Button variant="danger" className="flex-1" onClick={() => send({ type: "RESET" })}>{S.score.resetYes}</Button>
          </div>
        </Paper>
      ) : (
        <Button variant="ghost" onClick={() => setConfirming(true)}>{S.score.reset}</Button>
      )}
    </Screen>
  );
}

export function IntervalPhase({ onNext }: { onNext: () => void }) {
  return (
    <Screen tone="table">
      {/* TODO(P4): projector-style ഇടവേള title card */}
      <Paper className="mt-10 text-center">
        <h1 className="font-ml text-5xl font-bold">{S.interval.heading}</h1>
        <p className="font-display text-xl">{S.interval.sub}</p>
        <p className="mt-2">{S.interval.body}</p>
      </Paper>
      <Button onClick={onNext}>{S.interval.next}</Button>
    </Screen>
  );
}

export function EndPhase({ s, send }: P) {
  const [wheel, setWheel] = useState(false);
  const names = (ids: number[]) => ids.map((i) => s.players[i]).join(", ");
  const losers = names(lastPlaceIds(s.totals));
  return (
    <Screen tone="table" title={S.end.heading}>
      <Celebration names={names(winnerIds(s.totals))} />
      <Paper>
        <p className="font-ml text-lg">{S.end.last(losers)}</p>
        <Button className="mt-3 w-full" onClick={() => setWheel(true)}>{S.end.dare}</Button>
      </Paper>
      <ScoreSheet s={s} />
      <p className="font-ml text-4xl">{S.end.finale}</p>
      <Button onClick={() => send({ type: "PLAY_AGAIN" })}>{S.end.again}</Button>
      {/* TODO(P3): loser meme + sounds; TODO(P4): ശുഭം end card styling */}
      {wheel && <DareWheel names={losers} onClose={() => setWheel(false)} />}
    </Screen>
  );
}


