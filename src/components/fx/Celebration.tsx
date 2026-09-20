import { motion, useReducedMotion } from "motion/react";
import { useEffect } from "react";
import { S } from "../../config/strings";

const GOLD = ["#ffd54a", "#ffb300", "#fff2b3", "#e94b3c", "#3b6fd4"];

/** Confetti cannons from both sides plus a centre burst. Skipped for reduced motion. */
function useConfetti(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let stop = false;
    let burst = 0;
    // canvas-confetti is only needed here, so it loads on demand
    import("canvas-confetti").then(({ default: confetti }) => {
      if (stop) return;
      const end = Date.now() + 2400;
      const frame = () => {
        if (stop) return;
        confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.75 }, colors: GOLD });
        confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.75 }, colors: GOLD });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      frame();
      burst = window.setTimeout(
        () => !stop && confetti({ particleCount: 140, spread: 110, origin: { y: 0.55 }, colors: GOLD, scalar: 1.1 }),
        350,
      );
    });
    return () => {
      stop = true;
      clearTimeout(burst);
    };
  }, [enabled]);
}

const rand = (i: number, salt: number) => {
  const v = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

/** Slowly turning light rays behind the trophy: one big rotate, nothing else moves. */
function Rays({ reduced }: { reduced: boolean }) {
  return (
    <motion.div
      aria-hidden
      className="absolute left-1/2 top-1/2 -ml-52 -mt-52 h-104 w-104 rounded-full opacity-70"
      style={{
        background:
          "repeating-conic-gradient(from 0deg, rgb(255 220 120 / 0.5) 0deg 10deg, transparent 10deg 24deg)",
        WebkitMaskImage: "radial-gradient(circle, #000 25%, transparent 68%)",
        maskImage: "radial-gradient(circle, #000 25%, transparent 68%)",
      }}
      animate={reduced ? undefined : { rotate: 360 }}
      transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
    />
  );
}

/** Gold sparkles drifting up from the trophy, staggered and looping. */
function Sparkles({ reduced }: { reduced: boolean }) {
  if (reduced) return null;
  return (
    <>
      {Array.from({ length: 18 }, (_, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="pointer-events-none absolute bottom-4 text-xl text-[#ffd54a]"
          style={{ left: `${8 + rand(i, 1) * 84}%` }}
          initial={{ opacity: 0, y: 0, scale: 0.4 }}
          animate={{ opacity: [0, 1, 0], y: -150 - rand(i, 2) * 90, scale: [0.4, 1.1, 0.5], rotate: rand(i, 3) * 180 }}
          transition={{ duration: 2.4 + rand(i, 4) * 1.6, delay: rand(i, 5) * 2.5, repeat: Infinity, ease: "easeOut" }}
        >
          ✦
        </motion.span>
      ))}
    </>
  );
}

function Trophy() {
  return (
    <svg viewBox="0 0 120 140" className="mx-auto h-32 w-28 drop-shadow-[0_8px_10px_rgb(0_0_0/0.45)]" aria-hidden>
      <path d="M30 14h60v34c0 22-14 36-30 36S30 70 30 48z" fill="#f2b90f" stroke="#8a6a12" strokeWidth="4" strokeLinejoin="round" />
      <path d="M30 24H12c0 24 8 36 22 40M90 24h18c0 24-8 36-22 40" fill="none" stroke="#c99a0c" strokeWidth="6" strokeLinecap="round" />
      <path d="M42 22v28c0 12 6 22 14 28" fill="none" stroke="#fff2b3" strokeWidth="5" strokeLinecap="round" opacity="0.7" />
      <rect x="52" y="82" width="16" height="22" fill="#c99a0c" stroke="#8a6a12" strokeWidth="3" />
      <rect x="34" y="104" width="52" height="16" rx="3" fill="#8a5a1e" stroke="#4a2e0c" strokeWidth="3" />
      <rect x="42" y="108" width="36" height="8" rx="2" fill="#d4a72c" />
    </svg>
  );
}

/** Winner reveal: rays, a trophy that drops in and bounces, sparkles, confetti, the name(s). */
export function Celebration({ names }: { names: string }) {
  const reduced = !!useReducedMotion();
  useConfetti(!reduced);
  return (
    <div className="paper relative overflow-hidden rounded-lg px-4 pb-6 pt-8 text-center">
      <Rays reduced={reduced} />
      <Sparkles reduced={reduced} />
      <div className="relative">
        <motion.div
          initial={reduced ? false : { y: -260, scale: 0.6, rotate: -14, opacity: 0 }}
          animate={{ y: 0, scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 180, damping: 11, mass: 0.9 }}
        >
          <Trophy />
        </motion.div>
        <motion.p
          className="mt-2 font-ml text-lg"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {S.end.winnerLabel}
        </motion.p>
        <motion.p
          className="font-display text-4xl font-bold text-stamp"
          initial={reduced ? false : { opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: [0.4, 1.2, 1] }}
          transition={{ delay: 0.65, duration: 0.5, times: [0, 0.6, 1] }}
        >
          {names}
        </motion.p>
      </div>
    </div>
  );
}
