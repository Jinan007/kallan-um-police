import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

const between = (a: number, b: number) => a + Math.random() * (b - a);

/**
 * Old-print look over everything. Nothing here touches layout or blocks taps.
 *  - grain: a pre-rendered noise PNG (public/img/noise.png, made by scripts/make-noise.mjs),
 *    tiled on an oversized layer that is only slid around with a stepped CSS transform,
 *  - vignette: one static radial gradient,
 *  - scratch: a thin bright vertical line that flashes at a random x every 6-14s,
 *  - flicker: a brief dark blink every 4-11s (projector lamp).
 * With reduced motion, only the static vignette and a still grain remain.
 */
export function FilmLayer() {
  const reduced = !!useReducedMotion();
  const [scratch, setScratch] = useState<{ id: number; x: number } | null>(null);
  const [flicker, setFlicker] = useState(0);

  useEffect(() => {
    if (reduced) return;
    let n = 0;
    let scratchTimer = 0;
    let flickerTimer = 0;
    const nextScratch = () => {
      scratchTimer = window.setTimeout(() => {
        setScratch({ id: ++n, x: between(4, 96) });
        nextScratch();
      }, between(6000, 14000));
    };
    const nextFlicker = () => {
      flickerTimer = window.setTimeout(() => {
        setFlicker((f) => f + 1);
        nextFlicker();
      }, between(4000, 11000));
    };
    nextScratch();
    nextFlicker();
    return () => {
      clearTimeout(scratchTimer);
      clearTimeout(flickerTimer);
    };
  }, [reduced]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      <div className={`film-grain ${reduced ? "" : "film-grain-anim"}`} />
      <div className="film-vignette absolute inset-0" />
      {scratch && (
        <div key={scratch.id} className="film-scratch" style={{ left: `${scratch.x}%` }} />
      )}
      {flicker > 0 && <div key={flicker} className="film-flicker" />}
    </div>
  );
}
