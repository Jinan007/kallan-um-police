import { motion, useReducedMotion } from "motion/react";
import { S } from "../../config/strings";
import { useMeme } from "../../memes/memes";
import type { MemeEvent } from "../../memes/memes";

// Torn bottom edge for the caption strip (static clip, never animated).
const TORN =
  "polygon(0 0,100% 0,100% 82%,95% 96%,88% 84%,80% 98%,72% 86%,63% 97%,55% 84%,46% 98%,38% 85%,29% 97%,21% 84%,12% 97%,5% 85%,0 96%)";

interface Props {
  event: MemeEvent;
  /** Tilt in degrees. Small frames on one row usually lean opposite ways. */
  tilt?: number;
  /** Seconds before it drops onto the page. */
  delay?: number;
  className?: string;
}

/**
 * A meme in a vintage photo frame: cream border, photo mount corners, a slightly faded print,
 * and a torn-edge caption strip. If the event's folder has no image, a styled placeholder
 * stands in, so the layout is identical either way.
 */
export function MemeFrame({ event, tilt = -2, delay = 0, className = "" }: Props) {
  const reduced = useReducedMotion();
  const { url, ready } = useMeme(event);
  const caption = S.memes[event];
  return (
    <motion.figure
      className={`pointer-events-none relative mx-auto w-full max-w-64 bg-[#f6efdc] p-2 pb-0 shadow-[0_6px_16px_rgb(0_0_0/0.45)] ${className}`}
      initial={reduced ? false : { opacity: 0, y: -40, scale: 1.25, rotate: tilt * 3 }}
      animate={{ opacity: 1, y: 0, scale: 1, rotate: tilt }}
      transition={{ delay, type: "spring", stiffness: 260, damping: 20 }}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#2a1c0e]">
        {ready && url ? (
          <img
            src={url}
            alt={caption}
            draggable={false}
            className="h-full w-full object-cover [object-position:50%_22%] [filter:sepia(0.35)_contrast(1.05)_saturate(0.9)]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-[repeating-linear-gradient(45deg,#3a2716_0_10px,#33220f_10px_20px)] text-center text-[#e6d3aa]">
            <svg viewBox="0 0 48 48" className="h-10 w-10 opacity-80" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <rect x="4" y="10" width="40" height="28" rx="3" />
              <circle cx="24" cy="24" r="7" />
              <path d="M12 10 16 5h16l4 5" />
            </svg>
            <span className="font-ml text-sm opacity-90">{ready ? S.memes.placeholder : ""}</span>
          </div>
        )}
        {/* photo-mount corners, so it reads as a print in an album */}
        {["left-0 top-0", "right-0 top-0 rotate-90", "right-0 bottom-0 rotate-180", "left-0 bottom-0 -rotate-90"].map((pos) => (
          <span key={pos} aria-hidden className={`absolute h-4 w-4 bg-[#f6efdc] [clip-path:polygon(0_0,100%_0,0_100%)] ${pos}`} />
        ))}
        {/* a soft vignette over the print */}
        <span aria-hidden className="absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_55%,rgb(30_15_0/0.35))]" />
      </div>
      <figcaption
        className="paper -mx-2 mt-1 px-3 pb-4 pt-2 text-center font-hand text-lg font-bold leading-tight"
        style={{ clipPath: TORN }}
      >
        {caption}
      </figcaption>
    </motion.figure>
  );
}
