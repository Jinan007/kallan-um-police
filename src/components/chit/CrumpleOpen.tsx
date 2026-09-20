import { motion, useReducedMotion } from "motion/react";
import { useMemo } from "react";
import type { ReactNode } from "react";
import { MOTION } from "../../config/motion";
import { ballTexture, creaseTexture } from "./crumple";

const { height, openSec, closeSec, textureSize } = MOTION.crumple;
// Torn edge for the sheet (static clip, never animated).
const TORN =
  "polygon(0 3%,7% 0,19% 2%,33% 0,47% 3%,61% 0,76% 2%,90% 0,100% 3%,100% 97%,92% 100%,78% 98%,63% 100%,48% 97%,34% 100%,20% 98%,8% 100%,0 97%)";

interface Props {
  open: boolean;
  content: ReactNode;
  seed: number;
}

/**
 * A crumpled ball that opens into a wrinkled sheet while `open` is true.
 * Everything animated is transform or opacity:
 *  - the ball swells, spins and fades out,
 *  - the sheet grows from small with a wobbling 3D tilt (like fingers smoothing it out),
 *  - a crease overlay fades from strong to faint, so the wrinkles relax but never vanish,
 *  - the text fades in last, once the sheet is mostly flat.
 */
export function CrumpleOpen({ open, content, seed }: Props) {
  const reduced = !!useReducedMotion();
  const ball = useMemo(() => ballTexture(seed, textureSize), [seed]);
  const crease = useMemo(() => creaseTexture(seed), [seed]);
  const quick = { duration: 0 };

  return (
    <div className="relative mx-auto w-full max-w-72" style={{ height }}>
      <motion.img
        src={ball}
        alt=""
        draggable={false}
        className="absolute left-1/2 top-1/2 h-44 w-44 -ml-22 -mt-22"
        initial={false}
        animate={open ? { scale: 1.7, rotate: 40, opacity: 0 } : { scale: 1, rotate: 0, opacity: 1 }}
        transition={reduced ? quick : { duration: open ? openSec * 0.6 : closeSec, ease: "easeOut" }}
      />

      <motion.div
        className="paper absolute inset-0 overflow-hidden"
        style={{ clipPath: TORN, transformPerspective: 700 }}
        initial={false}
        animate={
          open
            ? { scale: 1, opacity: 1, rotate: 0, rotateX: 0 }
            : { scale: 0.25, opacity: 0, rotate: -10, rotateX: 40 }
        }
        transition={
          reduced
            ? quick
            : open
              ? { duration: openSec, ease: [0.2, 0.9, 0.3, 1.15] }
              : { duration: closeSec, ease: "easeIn" }
        }
      >
        <motion.div
          className="absolute inset-0"
          style={{ backgroundImage: `url(${crease})`, backgroundSize: "100% 100%" }}
          initial={false}
          animate={{ opacity: open ? 0.5 : 1 }}
          transition={reduced ? quick : { duration: open ? openSec * 1.4 : closeSec }}
        />
        <motion.div
          className="absolute inset-0"
          initial={false}
          animate={{ opacity: open ? 1 : 0 }}
          transition={reduced ? quick : { duration: 0.25, delay: open ? openSec * 0.6 : 0 }}
        >
          {content}
        </motion.div>
      </motion.div>
    </div>
  );
}
