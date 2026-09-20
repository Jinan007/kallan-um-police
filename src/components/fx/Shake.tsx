import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { MOTION } from "../../config/motion";

interface Props {
  children: ReactNode;
  /** Seconds to wait before the shake starts. */
  at?: number;
  /** Set false to hold still (used when the same wrapper stays mounted across phases). */
  active?: boolean;
  className?: string;
}

// A decaying wobble: big hits first, settling to nothing. x/y in px, rotate in degrees.
const X = [0, -14, 12, -10, 8, -6, 4, -2, 1, 0];
const Y = [0, 7, -6, 5, -4, 3, -2, 1, -1, 0];
const R = [0, -0.6, 0.5, -0.4, 0.3, -0.2, 0.15, -0.08, 0.04, 0];

/** Shakes its children once, `at` seconds after it becomes active. */
export function Shake({ children, at = 0, active = true, className = "h-full" }: Props) {
  const reduced = useReducedMotion();
  const go = active && !reduced;
  return (
    <motion.div
      className={className}
      animate={go ? { x: X, y: Y, rotate: R } : { x: 0, y: 0, rotate: 0 }}
      transition={go ? { delay: at, duration: MOTION.policeBadge.shakeSec + 0.1, ease: "easeOut" } : { duration: 0 }}
    >
      {children}
    </motion.div>
  );
}
