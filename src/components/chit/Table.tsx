import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MOTION } from "../../config/motion";
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
  mode: "shuffle" | "pick";
  onShuffleDone?: () => void;
  onPick?: (slot: number) => void;
}

const { chit } = MOTION;
const cosTilt = Math.cos((MOTION.table.tiltDeg * Math.PI) / 180);
// Torn edges for the flat notebook-paper bit that first drops onto the table.
const TORN =
  "polygon(0 6%,12% 0,26% 5%,41% 0,57% 6%,72% 0,88% 5%,100% 1%,100% 94%,86% 100%,70% 95%,55% 100%,38% 94%,22% 100%,8% 95%,0 100%)";

/**
 * Where players have dragged chits to. Lives outside React state because the
 * table remounts for every player's turn but the chits should stay where they were left.
 */
const dragged: { seed: number; pos: Record<number, { x: number; y: number }> } = { seed: -1, pos: {} };

const clamp = (v: number, lim: number) => Math.max(-lim, Math.min(lim, v));

interface ChitProps {
  i: number;
  slot: Slot;
  stage: Stage;
  mode: Props["mode"];
  taken: boolean;
  lifted: boolean;
  reduced: boolean;
  limitX: number;
  limitY: number;
  saved: { x: number; y: number } | undefined;
  ball: string;
  onTap: (i: number) => void;
  onMoved: (i: number, x: number, y: number) => void;
}

/**
 * One crumpled chit. Its position lives in motion values so a finger can drag it
 * with no React re-render per frame. Only x, y, z, rotate, scale and opacity change.
 */
function TableChit(p: ChitProps) {
  const { i, slot, stage, mode, taken, lifted, reduced, saved } = p;
  const shuffling = mode === "shuffle" && !reduced;
  const home = saved ?? slot;
  const x = useMotionValue(shuffling ? 0 : home.x);
  const y = useMotionValue(shuffling ? -160 : home.y);
  const rot = useMotionValue(shuffling ? slot.rot * 2 : slot.rot);
  const z = useMotionValue(0);
  const scale = useMotionValue(shuffling ? 1.2 : 1);
  const opacity = useMotionValue(shuffling ? 0 : 1);
  const userMoved = useRef(!!saved);
  const gesture = useRef<{ px: number; py: number; bx: number; by: number; moved: boolean } | null>(null);

  useEffect(() => {
    const running: { stop: () => void }[] = [];
    const go = (mv: typeof x, to: number, t: object) =>
      running.push(animate(mv, to, reduced ? { duration: 0 } : t));
    const spring = { type: "spring" as const, stiffness: 420, damping: 24 };

    if (taken) {
      go(opacity, 0, { duration: 0.2 });
      go(scale, 0.4, { duration: 0.2 });
    } else if (lifted) {
      go(y, y.get() - 26, spring);
      go(scale, 1.3, spring);
      go(rot, 0, spring);
      go(z, 70, spring);
    } else if (stage === "appear") {
      const t = { duration: 0.35, delay: i * 0.05, ease: "easeOut" as const };
      go(x, 0, t);
      go(y, 0, t);
      go(opacity, 1, t);
      go(scale, 1, t);
      go(rot, slot.rot * 0.35, t);
    } else if (stage === "scatter") {
      const t = { type: "spring" as const, stiffness: 150, damping: 15, delay: i * 0.04 };
      go(x, slot.x, t);
      go(y, slot.y, t);
      go(rot, slot.rot, t);
    } else if (stage === "table" && !userMoved.current) {
      const t = { duration: 0.2 };
      go(x, slot.x, t);
      go(y, slot.y, t);
      go(rot, slot.rot, t);
      go(opacity, 1, t);
      go(scale, 1, t);
    }
    return () => running.forEach((r) => r.stop());
    // motion values are stable; only these inputs should restart the animation
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taken, lifted, stage, reduced, slot.x, slot.y, slot.rot, i]);

  const interactive = mode === "pick" && !taken && !lifted;

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
      animate(z, 40, { duration: 0.12 });
    }
    x.set(clamp(g.bx + dx, p.limitX));
    // The table is tilted, so a vertical finger move covers less table: stretch it back.
    y.set(clamp(g.by + dy / cosTilt, p.limitY));
  };
  const finish = (tap: boolean) => {
    const g = gesture.current;
    gesture.current = null;
    if (!g) return;
    if (g.moved) {
      animate(scale, 1, { duration: 0.15 });
      animate(z, 0, { duration: 0.15 });
      userMoved.current = true;
      p.onMoved(i, x.get(), y.get());
    } else {
      animate(scale, 1, { duration: 0.1 });
      if (tap) p.onTap(i);
    }
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
      className="absolute left-1/2 top-1/2"
      style={{
        x, y, z, scale, opacity, rotate: rot,
        width: chit.w,
        height: chit.h,
        marginLeft: -chit.w / 2,
        marginTop: -chit.h / 2,
        transformStyle: "preserve-3d",
        touchAction: "none",
        cursor: interactive ? "grab" : "default",
        pointerEvents: taken ? "none" : "auto",
      }}
    >
      <motion.span
        className="paper absolute inset-2 block"
        style={{ clipPath: TORN, backgroundSize: "100% 10px" }}
        animate={{ scaleX: flat ? 1 : 0.2, opacity: flat ? 1 : 0 }}
        transition={fade}
      />
      <motion.img
        src={p.ball}
        alt=""
        draggable={false}
        className="pointer-events-none absolute inset-0 h-full w-full select-none"
        animate={{ opacity: flat ? 0 : 1, scale: flat ? 0.4 : 1 }}
        transition={fade}
      />
    </motion.button>
  );
}

/**
 * Wooden table seen at an angle.
 * Shuffle: flat torn paper drops in a pile, crumples into balls, the pile shakes, then the
 * balls spring to their spots. Pick: players can drag chits around; a tap picks one.
 */
export function Table({ count, seed, owners, mode, onShuffleDone, onPick }: Props) {
  const reduced = !!useReducedMotion();
  const plane = useRef<HTMLDivElement>(null);
  const { w, h } = useSize(plane);
  const slots = useMemo(
    () => (w ? computeSlots(count, w, h, chit.w, chit.h, seed) : []),
    [count, w, h, seed],
  );
  const balls = useMemo(
    () => [0, 1, 2, 3].map((k) => ballTexture(seed * 7 + k, MOTION.crumple.textureSize)),
    [seed],
  );
  const [stage, setStage] = useState<Stage>(mode === "shuffle" ? "appear" : "table");
  const [lifted, setLifted] = useState<number | null>(null);
  const done = useRef(onShuffleDone);
  done.current = onShuffleDone;

  if (mode === "shuffle" && dragged.seed !== seed) {
    dragged.seed = seed;
    dragged.pos = {};
  }

  useEffect(() => {
    if (mode !== "shuffle" || !w) return;
    if (reduced) {
      setStage("table");
      done.current?.();
      return;
    }
    const t = MOTION.shuffle;
    const steps: [number, () => void][] = [
      [t.appearMs, () => setStage("roll")],
      [t.appearMs + t.rollMs, () => setStage("shake")],
      [t.appearMs + t.rollMs + t.shakeMs, () => setStage("scatter")],
      [t.appearMs + t.rollMs + t.shakeMs + t.scatterMs, () => { setStage("table"); done.current?.(); }],
    ];
    const ids = steps.map(([ms, fn]) => window.setTimeout(fn, ms));
    return () => ids.forEach(clearTimeout);
  }, [mode, w, reduced]);

  const pick = (slot: number) => {
    if (lifted !== null || mode !== "pick") return;
    setLifted(slot);
    window.setTimeout(() => onPick?.(slot), reduced ? 0 : MOTION.pickLiftMs);
  };

  return (
    <div className="wood-room relative w-full overflow-hidden rounded-2xl shadow-[0_10px_30px_rgb(0_0_0/0.5)]"
      style={{ height: MOTION.table.height, perspective: MOTION.table.perspective }}
    >
      <div
        ref={plane}
        className="wood-top absolute inset-x-[3%] inset-y-[5%] rounded-xl"
        style={{ transform: `rotateX(${MOTION.table.tiltDeg}deg)`, transformStyle: "preserve-3d" }}
      >
        <motion.div
          className="absolute inset-0"
          style={{ transformStyle: "preserve-3d" }}
          animate={
            stage === "shake" && !reduced
              ? { rotate: [0, -5, 5, -4, 4, -2, 0], x: [0, -8, 8, -6, 6, -2, 0] }
              : { rotate: 0, x: 0 }
          }
          transition={{ duration: MOTION.shuffle.shakeMs / 1000, ease: "easeInOut" }}
        >
          {slots.map((slot, i) => (
            <TableChit
              key={i}
              i={i}
              slot={slot}
              stage={stage}
              mode={mode}
              taken={owners[i] !== null}
              lifted={lifted === i}
              reduced={reduced}
              limitX={w / 2 - chit.w / 2}
              limitY={h / 2 - chit.h / 2}
              saved={mode === "pick" && dragged.seed === seed ? dragged.pos[i] : undefined}
              ball={balls[i % balls.length]}
              onTap={pick}
              onMoved={(k, px, py) => { dragged.pos[k] = { x: px, y: py }; }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}
