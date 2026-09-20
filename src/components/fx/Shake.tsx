import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { MOTION } from "../../config/motion";

/** Wraps a screen and shakes it once, `at` seconds after mount (a decaying wobble on x/y). */
export function Shake({ children, at = 0 }: { children: ReactNode; at?: number }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className="h-full"
      animate={reduced ? undefined : { x: [0, -10, 9, -7, 5, -3, 0], y: [0, 5, -4, 3, -2, 1, 0] }}
      transition={{ delay: at, duration: MOTION.policeBadge.shakeSec, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
