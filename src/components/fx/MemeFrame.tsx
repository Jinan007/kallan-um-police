import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { S } from "../../config/strings";
import { useMeme } from "../../memes/memes";
import type { MemeEvent } from "../../memes/memes";

// Torn bottom edge for the caption strip (static clip, never animated).
const TORN =
  "polygon(0 0,100% 0,100% 82%,95% 96%,88% 84%,80% 98%,72% 86%,63% 97%,55% 84%,46% 98%,38% 85%,29% 97%,21% 84%,12% 97%,5% 85%,0 96%)";

/** Line icons for the title card shown when an event has no photo. 48x48, drawn with strokes. */
const ICONS: Record<MemeEvent, ReactNode> = {
  police_reveal: (
    <>
      <polygon points="24,4 28,15 39,11 37,23 46,29 36,33 38,45 27,40 24,46 21,40 10,45 12,33 2,29 11,23 9,11 20,15" />
      <circle cx="24" cy="26" r="7" />
    </>
  ),
  caught: (
    <>
      <circle cx="14" cy="26" r="9" />
      <circle cx="34" cy="26" r="9" />
      <path d="M23 26h2M14 10v6M34 10v6" />
    </>
  ),
  escaped: (
    <>
      <path d="M4 14h16M2 24h20M6 34h14" />
      <path d="M26 12l18 12-18 12z" />
    </>
  ),
  wrong_accuse: (
    <>
      <circle cx="24" cy="24" r="19" />
      <path d="m16 16 16 16m0-16L16 32" />
    </>
  ),
  king_reveal: <path d="M6 36 4 12l12 12 8-16 8 16 12-12-2 24zM6 42h36" />,
  last_place: (
    <>
      <circle cx="24" cy="24" r="19" />
      <path d="M16 19v3M32 19v3M16 34c3-5 13-5 16 0" />
    </>
  ),
};

interface Props {
  event: MemeEvent;
  /** Tilt in degrees. Small frames on one row usually lean opposite ways. */
  tilt?: number;
  /** Seconds before it drops onto the page. */
  delay?: number;
  className?: string;
}

/**
 * A reaction in a vintage photo frame: cream border, photo mount corners and a torn-edge caption.
 * If the event's folder (public/memes/<event>/) holds an image, it is shown, faded like an old
 * print. Otherwise an old-film title card with an icon stands in, so the layout is the same.
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
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#241608]">
        {ready && url ? (
          <img
            src={url}
            alt={caption}
            draggable={false}
            className="h-full w-full object-cover [object-position:50%_22%] [filter:sepia(0.35)_contrast(1.05)_saturate(0.9)]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(ellipse_at_center,#3d2a14,#1c1108)]">
            <span aria-hidden className="absolute inset-2 border-2 border-[#c9a45a]/50" />
            <span aria-hidden className="absolute inset-3.5 border border-[#c9a45a]/30" />
            <svg
              viewBox="0 0 48 48"
              className="h-16 w-16 text-[#e6d3aa]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              role="img"
              aria-label={caption}
            >
              {ICONS[event]}
            </svg>
          </div>
        )}
        {/* photo-mount corners, so it reads as a print in an album */}
        {["left-0 top-0", "right-0 top-0 rotate-90", "right-0 bottom-0 rotate-180", "left-0 bottom-0 -rotate-90"].map((pos) => (
          <span key={pos} aria-hidden className={`absolute h-4 w-4 bg-[#f6efdc] [clip-path:polygon(0_0,100%_0,0_100%)] ${pos}`} />
        ))}
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
