/** Every animation timing and size lives here. Seconds unless the name ends in Ms. */
export const MOTION = {
  tap: { scale: 0.95, seconds: 0.09 },

  table: { perspective: 900, tiltDeg: 32, height: "52dvh" },
  chit: { w: 56, h: 64, tubeW: 24, tubeH: 60 },

  shuffle: { appearMs: 750, rollMs: 600, shakeMs: 800, scatterMs: 900 },
  pickLiftMs: 260,

  unroll: {
    strips: 5,
    height: 240,
    staggerSec: 0.075,
    openSec: 0.3,
    closeSec: 0.22,
    foldedDeg: -100,
  },

  policeBadge: { slamSec: 0.35, shakeDelaySec: 0.3, shakeSec: 0.4 },
  stamp: { landSec: 0.35, thiefDelaySec: 0.55, listDelaySec: 1.1, rowStaggerSec: 0.14 },
  suspense: { jitterSec: 0.12 },
} as const;
