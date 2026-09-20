/** Every animation timing and size lives here. Seconds unless the name ends in Ms. */
export const MOTION = {
  tap: { scale: 0.95, seconds: 0.09 },

  table: { perspective: 900, tiltDeg: 28, height: "56dvh" },
  chit: { w: 72, h: 72, dragThresholdPx: 8 },

  shuffle: { appearMs: 900, rollMs: 600, shakeMs: 800, scatterMs: 900 },
  pickLiftMs: 260,

  crumple: { height: 250, openSec: 0.55, closeSec: 0.3, textureSize: 192 },

  policeBadge: { slamSec: 0.35, shakeDelaySec: 0.3, shakeSec: 0.4 },
  stamp: { landSec: 0.35, thiefDelaySec: 0.55, listDelaySec: 1.1, rowStaggerSec: 0.14 },
  suspense: { jitterSec: 0.12 },
} as const;

