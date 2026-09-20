import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MOTION } from "../../config/motion";
import { haptic } from "../../hooks/useHold";
import { useSize } from "../../hooks/useSize";
import { computeSlots } from "./slots";

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
// Torn top and bottom edges for the flat notebook-paper bit.
const TORN = "polygon(0 6%,12% 0,26% 5%,41% 0,57% 6%,72% 0,88% 5%,100% 1%,100% 94%,86% 100%,70% 95%,55% 100%,38% 94%,22% 100%,8% 95%,0 100%)";

/**
 * Wooden table seen at an angle. Chits are absolutely centred and moved with
 * transform only (x, y, rotate, opacity), so nothing reflows.
 *
 * Shuffle sequence: appear (flat torn paper drops in a pile) -> roll (paper
 * squeezes into a tube) -> shake (whole pile wobbles) -> scatter (springs to slots).
 */
export function Table({ count, seed, owners, mode, onShuffleDone, onPick }: Props) {
  const reduced = !!useReducedMotion();
  const plane = useRef<HTMLDivElement>(null);
  const { w, h } = useSize(plane);
  const slots = useMemo(
    () => (w ? computeSlots(count, w, h, chit.w, chit.h, seed) : []),
    [count, w, h, seed],
  );
  const [stage, setStage] = useState<Stage>(mode === "shuffle" ? "appear" : "table");
  const [lifted, setLifted] = useState<number | null>(null);
  const done = useRef(onShuffleDone);
  done.current = onShuffleDone;

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

  const pile = stage === "appear" || stage === "roll" || stage === "shake";
  const flat = stage === "appear";

  const pick = (slot: number) => {
    if (lifted !== null || mode !== "pick") return;
    setLifted(slot);
    window.setTimeout(() => onPick?.(slot), reduced ? 0 : MOTION.pickLiftMs);
  };

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl bg-wood-dark"
      style={{ height: MOTION.table.height, perspective: MOTION.table.perspective }}
    >
      <div
        ref={plane}
        className="absolute inset-x-[4%] inset-y-[6%] rounded-lg shadow-[0_30px_40px_rgb(0_0_0/0.5)]"
        style={{
          transform: `rotateX(${MOTION.table.tiltDeg}deg)`,
          transformStyle: "preserve-3d",
          background:
            "repeating-linear-gradient(92deg, rgb(255 255 255/0.05) 0 2px, transparent 2px 9px), repeating-linear-gradient(0deg, rgb(0 0 0/0.12) 0 1px, transparent 1px 46px), linear-gradient(135deg, #8a5a2f, #6b4423 55%, #5a381b)",
        }}
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
          {slots.map((slot, i) => {
            const taken = owners[i] !== null;
            const isLifted = lifted === i;
            const target = pile
              ? { x: 0, y: 0, rotate: slot.rot * 0.35, z: 0, scale: 1, opacity: 1 }
              : taken
                ? { x: slot.x, y: slot.y, rotate: slot.rot, z: 0, scale: 0.4, opacity: 0 }
                : isLifted
                  ? { x: slot.x, y: slot.y - 26, rotate: 0, z: 70, scale: 1.3, opacity: 1 }
                  : { x: slot.x, y: slot.y, rotate: slot.rot, z: 0, scale: 1, opacity: 1 };
            const transition = reduced
              ? { duration: 0 }
              : stage === "appear"
                ? { duration: 0.35, delay: i * 0.05, ease: "easeOut" as const }
                : stage === "scatter"
                  ? { type: "spring" as const, stiffness: 150, damping: 15, delay: i * 0.04 }
                  : isLifted
                    ? { type: "spring" as const, stiffness: 420, damping: 24 }
                    : { duration: 0.2 };
            return (
              <motion.button
                key={i}
                type="button"
                aria-label={`Chit ${i + 1}`}
                disabled={mode !== "pick" || taken || lifted !== null}
                onPointerDown={() => mode === "pick" && !taken && haptic()}
                onClick={() => pick(i)}
                className="absolute left-1/2 top-1/2 touch-manipulation"
                style={{
                  width: chit.w,
                  height: chit.h,
                  marginLeft: -chit.w / 2,
                  marginTop: -chit.h / 2,
                  transformStyle: "preserve-3d",
                  pointerEvents: taken ? "none" : "auto",
                }}
                initial={mode === "shuffle" && !reduced ? { x: 0, y: -160, rotate: slot.rot * 2, opacity: 0, scale: 1.2 } : false}
                animate={target}
                transition={transition}
                whileTap={mode === "pick" && !reduced ? { scale: MOTION.tap.scale } : undefined}
              >
                {/* flat torn notebook paper */}
                <motion.span
                  className="paper absolute inset-0 block"
                  style={{ clipPath: TORN, backgroundSize: "100% 12px" }}
                  animate={{ scaleX: flat ? 1 : 0.2, opacity: flat ? 1 : 0 }}
                  transition={reduced ? { duration: 0 } : { duration: MOTION.shuffle.rollMs / 1000, ease: "easeInOut" }}
                />
                {/* rolled tube */}
                <motion.span
                  className="absolute left-1/2 top-1/2 block rounded-full"
                  style={{
                    width: chit.tubeW,
                    height: chit.tubeH,
                    marginLeft: -chit.tubeW / 2,
                    marginTop: -chit.tubeH / 2,
                    background: "linear-gradient(90deg,#d8cba6,#fbf6e6 35%,#efe4c4 60%,#b9aa80)",
                    boxShadow: "0 6px 8px rgb(0 0 0/0.45)",
                  }}
                  animate={{ opacity: flat ? 0 : 1, scaleX: flat ? 0.3 : 1 }}
                  transition={reduced ? { duration: 0 } : { duration: MOTION.shuffle.rollMs / 1000, ease: "easeInOut" }}
                />
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
