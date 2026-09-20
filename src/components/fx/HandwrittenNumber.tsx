import { motion, useReducedMotion } from "motion/react";
import { GLYPHS } from "./glyphs";

const W = 11; // width of one character cell, in viewBox units
const H = 20;

/** Seconds for one character to be drawn, and the gap before the next one starts. */
export const PEN = { draw: 0.22, gap: 0.17 } as const;

/** How long a written number takes, so callers can schedule what comes after it. */
export const writeTime = (text: string) => (text.length - 1) * PEN.gap + PEN.draw;

interface Props {
  text: string;
  /** Seconds before the pen touches down. */
  delay?: number;
  /** false = already written (no animation), used for earlier rounds. */
  animate?: boolean;
  className?: string;
}

/**
 * Numbers "handwritten" in ink: each character is a pen stroke that draws itself.
 *
 * How it works: every glyph is one SVG path. Motion's `pathLength` prop animates the path from
 * 0 (nothing drawn) to 1 (fully drawn), which is done underneath with stroke-dasharray/-offset,
 * so the line appears to be pulled out by a moving pen. Characters start one after another, and
 * each is nudged by a small fixed tilt and baseline offset so a row of digits looks written by hand
 * rather than typeset. The opacity switch stops the round pen-cap showing as a dot before drawing starts.
 */
export function HandwrittenNumber({ text, delay = 0, animate = true, className = "" }: Props) {
  const reduced = useReducedMotion();
  const chars = [...text];
  const write = animate && !reduced;
  return (
    <svg
      role="img"
      aria-label={text}
      viewBox={`0 0 ${chars.length * W} ${H}`}
      className={`inline-block align-middle ${className}`}
      style={{ height: "1.15em", width: `${(chars.length * W * 1.15) / H}em` }}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {chars.map((ch, i) => {
        const d = GLYPHS[ch];
        if (!d) return null;
        const start = delay + i * PEN.gap;
        const tilt = ((i * 37) % 9) - 4; // -4..4 degrees
        const drop = ((i * 5) % 3) - 1; // -1..1 units
        return (
          <g key={i} transform={`translate(${i * W + 0.5} ${2 + drop * 0.6}) rotate(${tilt} 5 8)`}>
            <motion.path
              d={d}
              initial={write ? { pathLength: 0, opacity: 0 } : false}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{
                pathLength: { delay: start, duration: PEN.draw, ease: "easeInOut" },
                opacity: { delay: start, duration: 0.01 },
              }}
            />
          </g>
        );
      })}
    </svg>
  );
}
