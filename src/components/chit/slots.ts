export interface Slot {
  /** Offset from the centre of the table, in px. */
  x: number;
  y: number;
  /** Degrees. */
  rot: number;
}

/** Small deterministic PRNG so chits land in the same place after a re-render or refresh. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Jittered grid: every chit gets its own cell, so nothing overlaps and taps stay easy. */
export function computeSlots(
  count: number, w: number, h: number, chitW: number, chitH: number, seed: number,
): Slot[] {
  const cols = count <= 4 ? 2 : count <= 9 ? 3 : 4;
  const rows = Math.ceil(count / cols);
  const cellW = w / cols;
  const cellH = h / rows;
  const rand = mulberry32(seed);
  const jx = Math.max(0, (cellW - chitW) / 2) * 0.7;
  const jy = Math.max(0, (cellH - chitH) / 2) * 0.7;
  return Array.from({ length: count }, (_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      x: (col + 0.5) * cellW - w / 2 + (rand() * 2 - 1) * jx,
      y: (row + 0.5) * cellH - h / 2 + (rand() * 2 - 1) * jy,
      rot: (rand() * 2 - 1) * 24,
    };
  });
}
