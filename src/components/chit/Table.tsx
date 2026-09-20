import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { play } from "../../audio/sound";
import { MOTION } from "../../config/motion";
import type { Phase } from "../../game/reducer";
import { haptic } from "../../hooks/useHold";
import { useSize } from "../../hooks/useSize";
import { ballTexture } from "./crumple";
import { computeSlots } from "./slots";
import type { Slot } from "./slots";

type Stage = "appear" | "roll" | "shake" | "scatter" | "table";

interface Props {
  count: number;
  seed: number;
  /** owners[slot] !== null means that chit is taken and disappears. */
  owners: (number | null)[];
  phase: Phase;
  /** Whose turn it is to pick; a new turn clears the lifted chit. */
  pickIdx: number;
  onShuffleDone: () => void;
  onPick: (slot: number) => void;
}

const { chit } = MOTION;
const tilt = MOTION.table.tiltDeg;
const cosTilt = Math.cos((tilt * Math.PI) / 180);
// Torn edges for the flat notebook-paper bit that first drops onto the table.
const TORN =
  "polygon(0 6%,12% 0,26% 5%,41% 0,57% 6%,72% 0,88% 5%,100% 1%,100% 94%,86% 100%,70% 95%,55% 100%,38% 94%,22% 100%,8% 95%,0 100%)";
const clamp = (v: number, lim: number) => Math.max(-lim, Math.min(lim, v));

interface ChitProps {
  i: number;
  slot: Slot;
  stage: Stage;
  enabled: boolean;
  taken: boolean;
  lifted: boolean;
  reduced: boolean;
  limitX: number;
  limitY: number;
  ball: string;
  onTap: (i: number) => void;
}

/**
 * One crumpled chit. Position lives in motion values so a finger can drag it with no React
 * re-render per frame. The plane is tilted, so the ball is counter-tilted to stand upright on
 * the table (like a real object), with a flat contact shadow lying under it.
 */
function TableChit(p: ChitProps) {
  const { i, slot, stage, enabled, taken, lifted, reduced } = p;
  const start = useRef(stage === "appear" && !reduced).current;
  const x = useMotionValue(start ? 0 : slot.x);
  const y = useMotionValue(start ? -160 : slot.y);
  const rot = useMotionValue(start ? slot.rot * 2 : slot.rot);
  const z = useMotionValue(0);
  const scale = useMotionValue(start ? 1.2 : 1);
  const opacity = useMotionValue(start ? 0 : 1);
  const gesture = useRef<{ px: number; py: number; bx: number; by: number; moved: boolean } | null>(null);

  useEffect(() => {
    const running: { stop: () => void }[] = [];
    const go = (mv: typeof x, to: number | number[], t: object) =>
      running.push(animate(mv, to as number, reduced ? { duration: 0 } : t));
    const spring = { type: "spring" as const, stiffness: 420, damping: 24 };

    if (taken) {
      go(opacity, 0, { duration: 0.2 });
      go(scale, 0.4, { duration: 0.2 });
    } else if (lifted) {
      go(y, y.get() - 30, spring);
      go(scale, 1.35, spring);
      go(z, 90, spring);
    } else if (stage === "appear") {
      const t = { duration: 0.35, delay: i * 0.05, ease: "easeOut" as const };
      go(x, 0, t); go(y, 0, t); go(opacity, 1, t); go(scale, 1, t); go(rot, slot.rot * 0.35, t);
    } else if (stage === "shake") {
      // Every ball is rattled on its own: it spins, jumps and jitters out of step with the
      // others, while the whole pile shakes as one (see the group below).
      const d = MOTION.shuffle.shakeMs / 1000;
      const base = slot.rot * 0.35;
      const s = i % 2 ? 1 : -1;
      const t = { duration: d, ease: "easeOut" as const, delay: i * 0.015 };
      go(rot, [base, base + 26 * s, base - 22 * s, base + 16 * s, base - 12 * s, base + 7 * s, base], t);
      go(z, [0, 34, 4, 28, 2, 18, 0], t);
      go(x, [0, 9 * s, -8 * s, 6 * s, -5 * s, 3 * s, 0], t);
      go(y, [0, -7 * s, 8 * s, -5 * s, 4 * s, -2 * s, 0], t);
    } else if (stage === "scatter") {
      const t = { type: "spring" as const, stiffness: 150, damping: 15, delay: i * 0.04 };
      go(x, slot.x, t); go(y, slot.y, t); go(rot, slot.rot, t); go(scale, 1, t);
    } else if (stage === "table") {
      const t = { duration: 0.2 };
      go(x, slot.x, t); go(y, slot.y, t); go(rot, slot.rot, t); go(opacity, 1, t); go(scale, 1, t); go(z, 0, t);
    }
    return () => running.forEach((r) => r.stop());
    // motion values are stable; only these inputs should restart the animation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taken, lifted, stage, reduced, slot.x, slot.y, slot.rot, i]);

  const interactive = enabled && !taken && !lifted;

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!interactive) return;
    haptic();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* synthetic pointer: dragging still works without capture */
    }
    gesture.current = { px: e.clientX, py: e.clientY, bx: x.get(), by: y.get(), moved: false };
    if (!reduced) animate(scale, MOTION.tap.scale, { duration: MOTION.tap.seconds });
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g) return;
    const dx = e.clientX - g.px;
    const dy = e.clientY - g.py;
    if (!g.moved) {
      if (Math.hypot(dx, dy) < chit.dragThresholdPx) return;
      g.moved = true;
      animate(scale, 1.15, { duration: 0.12 });
      animate(z, 50, { duration: 0.12 });
    }
    x.set(clamp(g.bx + dx, p.limitX));
    // The table is tilted, so a vertical finger move covers less table: stretch it back.
    y.set(clamp(g.by + dy / cosTilt, p.limitY));
  };
  const finish = (tap: boolean) => {
    const g = gesture.current;
    gesture.current = null;
    if (!g) return;
    animate(scale, 1, { duration: 0.15 });
    if (g.moved) animate(z, 0, { duration: 0.15 });
    else if (tap) p.onTap(i);
  };

  const flat = stage === "appear";
  const fade = reduced ? { duration: 0 } : { duration: MOTION.shuffle.rollMs / 1000, ease: "easeInOut" as const };
  return (
    <motion.button
      type="button"
      aria-label={`Chit ${i + 1}`}
      disabled={!interactive}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={() => finish(true)}
      onPointerCancel={() => finish(false)}
      onClick={(e) => e.detail === 0 && interactive && p.onTap(i)} // keyboard activation
      className="pointer-events-auto absolute left-1/2 top-1/2"
      style={{
        x, y, z, scale, opacity,
        width: chit.w,
        height: chit.h,
        marginLeft: -chit.w / 2,
        marginTop: -chit.h / 2,
        transformStyle: "preserve-3d",
        touchAction: "none",
        cursor: interactive ? "grab" : "default",
        pointerEvents: taken || !enabled ? "none" : "auto",
      }}
    >
      {/* contact shadow: lies flat on the table, fades when the chit is picked up */}
      <motion.span
        aria-hidden
        className="absolute left-1/2 top-1/2 block rounded-full"
        style={{
          width: chit.w * 0.85,
          height: chit.h * 0.4,
          marginLeft: -chit.w * 0.425,
          marginTop: chit.h * 0.08,
          background: "radial-gradient(ellipse at center, rgb(0 0 0 / 0.6), transparent 70%)",
        }}
        initial={false}
        animate={{ opacity: flat ? 0 : lifted ? 0.35 : 1, scale: lifted ? 1.25 : 1 }}
        transition={fade}
      />
      {/* flat torn paper, only while the pile first drops in */}
      <motion.span
        className="paper absolute inset-3 block"
        style={{ clipPath: TORN, backgroundSize: "100% 10px", rotate: rot }}
        initial={false}
        animate={{ scaleX: flat ? 1 : 0.2, opacity: flat ? 1 : 0 }}
        transition={fade}
      />
      {/* the ball stands up: undo the table's tilt around its base */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ transform: `rotateX(${-tilt}deg)`, transformOrigin: "50% 82%" }}
      >
        <motion.img
          src={p.ball}
          alt=""
          draggable={false}
          className="h-full w-full select-none"
          initial={false}
          animate={{ opacity: flat ? 0 : 1, scale: flat ? 0.4 : 1 }}
          transition={fade}
        />
      </div>
    </motion.button>
  );
}

/**
 * The wooden table, mounted once behind every phase from shuffle to verdict, so the phases
 * can sit on translucent layers and the table and its chits stay visible underneath.
 *
 * Shuffle: flat torn paper drops in a pile, crumples into balls, the pile shakes, then the
 * balls spring to their spots. After that the balls stay put between turns; they can be
 * dragged around, and a tap picks one.
 */
export function Table({ count, seed, owners, phase, pickIdx, onShuffleDone, onPick }: Props) {
  const reduced = !!useReducedMotion();
  const plane = useRef<HTMLDivElement>(null);
  const { w, h } = useSize(plane);
  const [stage, setStage] = useState<Stage>(phase === "SHUFFLE" ? "appear" : "table");
  const [lifted, setLifted] = useState<number | null>(null);
  const done = useRef(onShuffleDone);
  done.current = onShuffleDone;

  const slots = useMemo(
    () => (w ? computeSlots(count, w, h, chit.w, chit.h, seed) : []),
    [count, w, h, seed],
  );
  const balls = useMemo(
    () => [0, 1, 2, 3].map((k) => ballTexture(seed * 7 + k, MOTION.crumple.textureSize)),
    [seed],
  );

  useEffect(() => setLifted(null), [phase, pickIdx]);

  useEffect(() => {
    if (!w) return;
    const ids: number[] = [];
    const at = (ms: number, fn: () => void) => ids.push(window.setTimeout(fn, ms));

    if (phase === "SHUFFLE") {
      if (reduced) {
        setStage("table");
        done.current();
      } else {
        const t = MOTION.shuffle;
        const a = t.appearMs, b = a + t.rollMs, c = b + t.shakeMs, d = c + t.scatterMs;
        setStage("appear");
        play("toss", { count });
        at(a, () => setStage("roll"));
        at(b, () => { setStage("shake"); play("shake", { duration: t.shakeMs / 1000 }); });
        at(c, () => { setStage("scatter"); play("toss", { count }); });
        at(d, () => { setStage("table"); done.current(); });
      }
    } else {
      setStage("table");
    }
    return () => ids.forEach(clearTimeout);
  }, [phase, w, reduced]);

  const enabled = phase === "PICK" && stage === "table";
  const pick = (slot: number) => {
    if (lifted !== null || !enabled) return;
    setLifted(slot);
    play("toss", { count: 1 });
    window.setTimeout(() => onPick(slot), reduced ? 0 : MOTION.pickLiftMs);
  };

  return (
    <div className="wood-room absolute inset-0 overflow-hidden" style={{ perspective: MOTION.table.perspective }}>
      <div
        ref={plane}
        className="wood-top absolute inset-x-[3%] bottom-[9%] top-[9%] rounded-xl"
        style={{ transform: `rotateX(${tilt}deg)`, transformStyle: "preserve-3d" }}
      >
        {/* far end of the table falls into shadow: sells the depth */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-xl"
          style={{ background: "linear-gradient(to bottom, rgb(12 6 2 / 0.65), transparent 50%)" }}
        />
        {/* the table's front edge: a strip folded down from the near side, so it has thickness */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-full h-7 rounded-b-md"
          style={{
            transformOrigin: "top",
            transform: "rotateX(-90deg)",
            background: "linear-gradient(#6b4423, #33200f)",
            boxShadow: "inset 0 2px 0 rgb(255 220 170 / 0.25)",
          }}
        />
        <motion.div
          className="absolute inset-0"
          style={{ transformStyle: "preserve-3d" }}
          animate={
            stage === "shake" && !reduced
              ? {
                  rotate: [0, -6, 6, -5, 5, -3.5, 3.5, -2, 2, -1, 0],
                  x: [0, -16, 14, -12, 10, -8, 6, -4, 3, -1, 0],
                  y: [0, 7, -6, 6, -5, 4, -3, 2, -1, 1, 0],
                }
              : { rotate: 0, x: 0, y: 0 }
          }
          transition={{ duration: MOTION.shuffle.shakeMs / 1000, ease: "easeOut" }}
        >
          {slots.map((slot, i) => (
            <TableChit
              key={i}
              i={i}
              slot={slot}
              stage={stage}
              enabled={enabled}
              taken={owners[i] !== null}
              lifted={lifted === i}
              reduced={reduced}
              limitX={w / 2 - chit.w / 2}
              limitY={h / 2 - chit.h / 2}
              ball={balls[i % balls.length]}
              onTap={pick}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
