import { motion, useReducedMotion } from "motion/react";
import { play } from "../../audio/sound";
import { useEffect, useRef, useState } from "react";
import { MOTION } from "../../config/motion";
import { ROLES, TIMINGS } from "../../config/rules";
import { S } from "../../config/strings";
import { policeId, rolesByPlayer, thiefId } from "../../game/reducer";
import type { GameState } from "../../game/reducer";
import { winnerIds, lastPlaceIds } from "../../game/scoring";
import { useHold } from "../../hooks/useHold";
import { CrumpleOpen } from "../chit/CrumpleOpen";
import { Badge } from "../fx/Badge";
import { Celebration } from "../fx/Celebration";
import { DareWheel } from "../fx/DareWheel";
import { Shake } from "../fx/Shake";
import { Stamp } from "../fx/Stamp";
import { SuspenseOverlay } from "../fx/SuspenseOverlay";
import { EndCard, IntervalCard } from "../fx/TitleCards";
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
  // paper crackles as it is opened and again as it is folded back
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    play("crinkle", { duration: held ? 0.55 : 0.35 });
  }, [held]);
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
  // the badge hits the desk at the end of its slam
  useEffect(() => {
    const id = window.setTimeout(() => play("stamp"), MOTION.policeBadge.slamSec * 1000);
    return () => clearTimeout(id);
  }, []);
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
        </Paper>
        <Button onClick={() => send({ type: "CONTINUE" })}>{S.policeCall.next}</Button>
      </Screen>
    </Shake>
  );
}

export function AccusePhase({ s, send }: P) {
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

      {target !== null && <SuspenseOverlay name={s.players[target]} ms={TIMINGS.suspenseMs} />}
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
  // the stamp hits when its scale reaches 1 (65% of the way through its animation)
  useEffect(() => {
    const id = window.setTimeout(() => play("stamp"), st.landSec * 0.65 * 1000);
    return () => clearTimeout(id);
  }, [st.landSec]);
  return (
    <Shake at={st.landSec * 0.65}>
      <Screen tone="table">
        <Paper className="pb-5 pt-6 text-center">
          <Stamp text={s.correct ? S.verdict.caught : S.verdict.wrong} tone={s.correct ? "blue" : "red"} />
          <motion.p className="mt-4 font-ml text-lg" {...fade(st.thiefDelaySec)}>
            {s.correct ? S.verdict.caughtLine(thief) : S.verdict.wrongLine(accused, thief)}
          </motion.p>
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
      <ScoreSheet s={s} writeNewest />
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

export function IntervalPhase({ s, onNext }: { s: GameState; onNext: () => void }) {
  // a projector whirr as the card comes up
  useEffect(() => {
    play("whirr", { duration: 1.4 });
  }, []);
  const lead = winnerIds(s.totals);
  return (
    <Screen tone="table">
      <IntervalCard
        leaders={lead.map((i) => s.players[i]).join(", ")}
        points={Math.max(...s.totals)}
        roundsLeft={s.totalRounds - s.round}
      />
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
      <EndCard />
      <Button onClick={() => send({ type: "PLAY_AGAIN" })}>{S.end.again}</Button>
      {wheel && <DareWheel names={losers} onClose={() => setWheel(false)} />}
    </Screen>
  );
}



