import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { play } from "../../audio/sound";
import { MOTION } from "../../config/motion";
import { S } from "../../config/strings";
import { suspenseBeats } from "../../game/suspense";

interface Props {
  name: string;
  ms: number;
}

/** A tiny deterministic wobble so the jitter is not a clean sine. */
const wob = (i: number) => Math.sin(i * 12.9898) * 0.5 + (i % 2 ? 0.5 : -0.5);

/**
 * The accusation suspense, built to tighten as it goes:
 *  - a dark tunnel closes in on the accused (one big radial gradient scaling down),
 *  - the card swells slowly and thumps on every heartbeat, and the beats get faster,
 *  - the card jitters harder and harder, then goes dead still for the last beat,
 *  - a snare roll and heartbeat play under it (see audio/sound.ts, same beat times),
 *  - the line of text changes twice, ending on "And the verdict is...".
 * Only transform and opacity are animated.
 */
export function SuspenseOverlay({ name, ms }: Props) {
  const reduced = useReducedMotion();
  const total = ms / 1000;
  const [line, setLine] = useState(0);

  const { scale, scaleTimes, x, xTimes } = useMemo(() => {
    const beats = suspenseBeats(total);
    const base = (t: number) => 0.85 + 0.32 * (t / total);
    const pts: [number, number][] = [[0, base(0)]];
    for (const b of beats) {
      pts.push([b - 0.01, base(b)], [b + 0.04, base(b) * 1.13], [b + 0.14, base(b)]);
    }
    pts.push([total, base(total) * 1.08]);
    // keep times strictly increasing and inside [0, total]
    const clean: [number, number][] = [];
    for (const [t, v] of pts) {
      const tt = Math.min(total, Math.max(0, t));
      if (!clean.length || tt > clean[clean.length - 1][0]) clean.push([tt, v]);
    }
    const n = 56;
    const jitter = Array.from({ length: n }, (_, i) => {
      const p = i / (n - 1);
      const calm = p > 0.9 ? 0 : 1; // dead still for the last beat
      return wob(i) * (0.6 + 7 * p * p) * calm;
    });
    return {
      scale: clean.map((c) => c[1]),
      scaleTimes: clean.map((c) => c[0] / total),
      x: jitter,
      xTimes: jitter.map((_, i) => i / (n - 1)),
    };
  }, [total]);

  useEffect(() => {
    const sound = play("drumroll", { duration: total });
    // vibrate on the beats: short pulses that come faster
    try {
      const beats = suspenseBeats(total);
      const pattern: number[] = [];
      let prev = 0;
      for (const b of beats) {
        pattern.push(Math.round((b - prev) * 1000) - 30, 30);
        prev = b;
      }
      navigator.vibrate?.(pattern);
    } catch {
      /* no vibration support */
    }
    const t1 = window.setTimeout(() => setLine(1), ms * 0.4);
    const t2 = window.setTimeout(() => setLine(2), ms * 0.78);
    return () => {
      sound.stop();
      clearTimeout(t1);
      clearTimeout(t2);
      try {
        navigator.vibrate?.(0);
      } catch {
        /* ignore */
      }
    };
  }, [total, ms]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-10 overflow-hidden bg-[#060302]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* warm lamp light on the spot where the card sits */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: "radial-gradient(circle at 50% 45%, #6b4a22 0, #1a0f06 40%, #060302 75%)" }}
      />
      {/* the tunnel: a huge soft-edged dark ring that closes in over the whole wait */}
      <motion.div
        aria-hidden
        className="absolute inset-0"
        style={{ background: "radial-gradient(circle at 50% 45%, transparent 18%, rgb(0 0 0 / 0.96) 58%)" }}
        initial={{ scale: reduced ? 1 : 2.6 }}
        animate={{ scale: reduced ? 1 : 0.8 }}
        transition={{ duration: total, ease: [0.5, 0, 0.9, 0.6] }}
      />

      <motion.div
        className="relative"
        animate={reduced ? { scale: 1.1 } : { scale }}
        transition={reduced ? { duration: 0 } : { duration: total, times: scaleTimes, ease: "easeOut" }}
      >
        <motion.div
          animate={reduced ? undefined : { x }}
          transition={{ duration: total, times: xTimes, ease: "linear" }}
          onAnimationStart={() => undefined}
        >
          <div className="paper rounded-lg px-8 py-6 text-center shadow-[0_0_60px_rgb(255_200_120/0.35)]">
            <p className="font-display text-4xl font-bold">{name}</p>
          </div>
        </motion.div>
      </motion.div>

      <motion.p
        key={line}
        className="relative font-ml text-xl text-paper"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: MOTION.suspense.jitterSec * 3 }}
      >
        {S.accuse.suspenseLines[line]}
      </motion.p>
    </motion.div>
  );
}
