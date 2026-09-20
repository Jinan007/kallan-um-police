import { describe, expect, it } from "vitest";
import { suspenseBeats } from "./suspense";

describe("suspenseBeats", () => {
  const beats = suspenseBeats(2.6);

  it("has several beats, all inside the window and leaving a silence before the end", () => {
    expect(beats.length).toBeGreaterThanOrEqual(4);
    expect(beats[0]).toBeGreaterThan(0);
    expect(beats[beats.length - 1]).toBeLessThan(2.6 - 0.3);
  });
  it("speeds up: every gap is no longer than the one before", () => {
    const gaps = beats.slice(1).map((b, i) => b - beats[i]);
    gaps.slice(1).forEach((g, i) => expect(g).toBeLessThanOrEqual(gaps[i] + 1e-6));
  });
  it("never gets faster than 0.2s apart", () => {
    const gaps = beats.slice(1).map((b, i) => b - beats[i]);
    gaps.forEach((g) => expect(g).toBeGreaterThanOrEqual(0.2 - 1e-6));
  });
  it("gives nothing for a window too short to fit a beat", () => {
    expect(suspenseBeats(0.5)).toEqual([]);
  });
});
