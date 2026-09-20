import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { S } from "../../config/strings";

/** Old-cinema title card frame: a cream card with a double border and ornaments in the corners. */
function CardFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`paper relative overflow-hidden rounded-sm border-[6px] border-double border-ink/70 ${className}`}>
      {["left-1.5 top-1.5", "right-1.5 top-1.5 rotate-90", "right-1.5 bottom-1.5 rotate-180", "left-1.5 bottom-1.5 -rotate-90"].map((pos) => (
        <svg key={pos} aria-hidden viewBox="0 0 20 20" className={`absolute h-5 w-5 text-ink/60 ${pos}`} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M2 18C2 8 8 2 18 2M2 11C2 6 6 2 11 2" />
        </svg>
      ))}
      {children}
    </div>
  );
}

/** A projector's light cone from the top of the screen, flickering, with dust drifting through it. */
function ProjectorBeam({ reduced }: { reduced: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[75vh] overflow-hidden">
      <motion.div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, rgb(255 236 190 / 0.28), rgb(255 236 190 / 0.04) 85%, transparent)",
          clipPath: "polygon(43% 0, 57% 0, 100% 100%, 0 100%)",
        }}
        animate={reduced ? undefined : { opacity: [0.85, 1, 0.7, 1, 0.9, 0.75, 1] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "linear" }}
      />
      {!reduced &&
        Array.from({ length: 9 }, (_, i) => (
          <motion.span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-[#fff3d0]"
            style={{ left: `${30 + ((i * 47) % 40)}%`, top: `${8 + ((i * 29) % 60)}%` }}
            animate={{ y: [0, -30 - (i % 3) * 14, 0], x: [0, (i % 2 ? 1 : -1) * 14, 0], opacity: [0, 0.9, 0] }}
            transition={{ duration: 4 + (i % 4), repeat: Infinity, delay: i * 0.6, ease: "easeInOut" }}
          />
        ))}
    </div>
  );
}

/** A tea glass with steam curling up: the intermission's chaya break. */
function ChaiGlass({ reduced }: { reduced: boolean }) {
  return (
    <svg viewBox="0 0 60 64" className="mx-auto h-16 w-16" fill="none" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {[20, 30, 40].map((x, i) => (
        <motion.path
          key={x}
          d={`M${x} 26c-4-5 4-8 0-13`}
          stroke="#8a6a4a"
          strokeWidth="2"
          initial={false}
          animate={reduced ? undefined : { opacity: [0, 0.8, 0], y: [4, -6, -12] }}
          transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.6 }}
        />
      ))}
      <path d="M13 30h34l-4 28a3 3 0 0 1-3 3H20a3 3 0 0 1-3-3z" fill="#e5a44a" fillOpacity="0.85" stroke="#1f3a6e" strokeWidth="2.4" />
      <path d="M13 30h34" stroke="#1f3a6e" strokeWidth="2.4" />
      <path d="M17 38h26" stroke="#fff" strokeOpacity="0.5" strokeWidth="2" />
    </svg>
  );
}

interface IntervalProps {
  /** Who is ahead so far, and how many rounds remain. */
  leaders: string;
  points: number;
  roundsLeft: number;
}

/** The ഇടവേള card between rounds: a title card under a flickering projector light. */
export function IntervalCard({ leaders, points, roundsLeft }: IntervalProps) {
  const reduced = !!useReducedMotion();
  return (
    <>
      <ProjectorBeam reduced={reduced} />
      <motion.div
        className="relative"
        initial={reduced ? false : { opacity: 0 }}
        animate={{ opacity: reduced ? 1 : [0, 1, 0.55, 1, 0.8, 1] }}
        transition={{ duration: 0.9, ease: "linear" }}
      >
        <CardFrame className="px-4 pb-6 pt-7">
          <p className="font-display text-xs tracking-[0.5em] text-ink/70">{S.interval.sub.toUpperCase()}</p>
          <h1 className="my-1 font-ml text-7xl font-bold leading-tight text-stamp [text-shadow:3px_3px_0_rgb(31_58_110/0.18)]">
            {S.interval.heading}
          </h1>
          <ChaiGlass reduced={reduced} />
          <p className="mt-1 font-hand text-xl">{S.interval.body}</p>
          <div className="mx-auto mt-4 w-4/5 border-t-2 border-ink/30 pt-3">
            <p className="font-ml text-sm text-ink/70">{S.interval.standings}</p>
            <p className="font-display text-xl font-bold">{S.interval.leading(leaders, points)}</p>
            <p className="font-ml text-sm text-ink/70">{S.interval.roundsLeft(roundsLeft)}</p>
          </div>
        </CardFrame>
      </motion.div>
    </>
  );
}

/**
 * The closing "ശുഭം" (The End) card. When it scrolls into view the lettering stamps in from large,
 * then the pen draws a flourish under it (one path, animated with pathLength).
 */
export function EndCard() {
  const reduced = !!useReducedMotion();
  return (
    <CardFrame className="px-4 pb-7 pt-8">
      <motion.h2
        className="font-ml text-8xl font-bold leading-none text-stamp [text-shadow:4px_4px_0_rgb(31_58_110/0.18)]"
        initial={reduced ? false : { opacity: 0, scale: 1.8, rotate: -6 }}
        whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
      >
        {S.end.finale}
      </motion.h2>
      <svg viewBox="0 0 200 24" className="mx-auto mt-2 h-6 w-48 text-ink" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
        <motion.path
          d="M6 14C30 4 46 22 70 12S110 4 130 13S170 20 194 8"
          initial={reduced ? false : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ delay: 0.5, duration: 0.9, ease: "easeInOut" }}
        />
      </svg>
      <p className="mt-1 font-display text-sm tracking-[0.5em] text-ink/70">{S.end.theEnd}</p>
    </CardFrame>
  );
}
