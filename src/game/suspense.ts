/**
 * Heartbeat times (seconds from the start) for the accusation suspense. The beats speed up:
 * they start about 0.6s apart and tighten toward 0.2s, and the last one lands well before
 * the end so there is a held-breath silence before the verdict.
 */
export function suspenseBeats(totalSec: number): number[] {
  const beats: number[] = [];
  const stopBefore = totalSec - 0.35;
  let t = 0.3;
  let gap = 0.6;
  while (t < stopBefore) {
    beats.push(Math.round(t * 1000) / 1000);
    t += gap;
    gap = Math.max(0.2, gap * 0.8);
  }
  return beats;
}
