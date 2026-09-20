import { motion, useReducedMotion } from "motion/react";
import { MOTION } from "../../config/motion";

/** Rubber stamp that hits the page: starts big and tilted, lands with a small rebound. */
export function Stamp({ text, tone }: { text: string; tone: "red" | "blue" }) {
  const reduced = useReducedMotion();
  const color = tone === "red" ? "text-stamp border-stamp" : "text-ink border-ink";
  return (
    <motion.div
      className={`mx-auto w-fit rounded-lg border-[6px] px-5 py-1 font-display text-5xl font-bold uppercase tracking-wide mix-blend-multiply ${color}`}
      initial={reduced ? false : { scale: 2.6, opacity: 0, rotate: -22 }}
      animate={{ scale: [2.6, 0.92, 1], opacity: 1, rotate: -6 }}
      transition={{ duration: MOTION.stamp.landSec, times: [0, 0.65, 1], ease: "easeIn" }}
    >
      {text}
    </motion.div>
  );
}

