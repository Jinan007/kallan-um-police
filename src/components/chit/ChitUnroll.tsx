import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { MOTION } from "../../config/motion";

const { strips, height, staggerSec, openSec, closeSec, foldedDeg } = MOTION.unroll;
const stripH = height / strips;

interface StripProps {
  index: number;
  open: boolean;
  reduced: boolean;
  content: ReactNode;
}

/**
 * One slice of the paper. Slice i is a child of slice i-1, hinged at its own top
 * edge, so rotations accumulate like a real scroll. `open` swings it from
 * folded (hidden edge-on) to flat, each level starting a beat after its parent.
 */
function Strip({ index, open, reduced, content }: StripProps) {
  // Opening: top slice first. Closing: deepest slice first (reverse the order).
  const order = open ? index : strips - 1 - index;
  return (
    <motion.div
      style={{ height: stripH, transformOrigin: "top", transformStyle: "preserve-3d", position: "relative" }}
      // Start folded so the role is never visible on first paint.
      initial={{ rotateX: foldedDeg }}
      animate={{ rotateX: open ? 0 : foldedDeg }}
      transition={
        reduced
          ? { duration: 0 }
          : { duration: open ? openSec : closeSec, delay: order * staggerSec, ease: open ? "easeOut" : "easeIn" }
      }
    >
      {/*
        Folded strips accumulate rotation (-100, -200, -300...) so some would face
        the viewer. Fade the face out instead of relying on backface-visibility.
        Opacity goes on the face only: opacity on a strip would flatten the 3D chain.
      */}
      <motion.div
        className="absolute inset-0 overflow-hidden"
        style={{ backfaceVisibility: "hidden" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: open ? 1 : 0 }}
        transition={
          reduced
            ? { duration: 0 }
            : { duration: 0.05, delay: order * staggerSec + (open ? 0 : closeSec - 0.05) }
        }
      >
        <div className="paper absolute inset-x-0 rounded-none" style={{ top: -index * stripH, height }}>
          {content}
        </div>
      </motion.div>
      {index < strips - 1 && (
        <div className="absolute inset-x-0" style={{ top: stripH, transformStyle: "preserve-3d" }}>
          <Strip index={index + 1} open={open} reduced={reduced} content={content} />
        </div>
      )}
    </motion.div>
  );
}

/** A paper scroll that unrolls downward while `open` is true. */
export function ChitUnroll({ open, content }: { open: boolean; content: ReactNode }) {
  const reduced = !!useReducedMotion();
  return (
    <div className="relative mx-auto w-full max-w-72" style={{ height: height + 30, perspective: 900 }}>
      <div className="absolute inset-x-0 top-0" style={{ transformStyle: "preserve-3d" }}>
        {/* the roll that stays at the top while the paper hangs from it */}
        <motion.div
          className="absolute -top-1 left-[-3%] z-10 h-6 w-[106%] rounded-full"
          style={{
            background: "linear-gradient(180deg,#d8cba6,#fbf6e6 40%,#c9bb92)",
            boxShadow: "0 5px 8px rgb(0 0 0/0.4)",
          }}
          animate={{ scaleY: open ? 0.7 : 1.4 }}
          transition={reduced ? { duration: 0 } : { duration: 0.3 }}
        />
        <div className="pt-2" style={{ transformStyle: "preserve-3d" }}>
          <Strip index={0} open={open} reduced={reduced} content={content} />
        </div>
      </div>
    </div>
  );
}
