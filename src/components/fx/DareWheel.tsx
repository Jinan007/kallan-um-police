import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import { DARES, WHEEL_COLORS } from "../../config/dares";
import { S } from "../../config/strings";
import { haptic } from "../../hooks/useHold";
import { Button } from "../layout/Button";

const SEG = 360 / DARES.length;
const R = 100;

const polar = (deg: number, r: number) => {
  const a = ((deg - 90) * Math.PI) / 180; // 0 deg = straight up
  return [100 + r * Math.cos(a), 100 + r * Math.sin(a)] as const;
};

function wedge(i: number) {
  const [x1, y1] = polar(i * SEG, R);
  const [x2, y2] = polar((i + 1) * SEG, R);
  return `M100 100 L${x1} ${y1} A${R} ${R} 0 0 1 ${x2} ${y2} Z`;
}

/**
 * Wheel of dares for the last-place player(s). Spinning is one `rotate` animation with a long
 * ease-out. The winning wedge is picked first, then the spin is aimed so that wedge stops
 * under the pointer at the top: rotation = -(wedge centre angle) modulo 360.
 */
export function DareWheel({ names, onClose }: { names: string; onClose: () => void }) {
  const reduced = !!useReducedMotion();
  const rotation = useMotionValue(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const last = useRef<number | null>(null);

  const spin = () => {
    if (spinning) return;
    haptic(20);
    setResult(null);
    let idx = Math.floor(Math.random() * DARES.length);
    if (DARES.length > 1 && idx === last.current) idx = (idx + 1) % DARES.length; // no instant repeat
    last.current = idx;
    const jitter = (Math.random() - 0.5) * SEG * 0.7; // land anywhere inside the wedge
    const centre = idx * SEG + SEG / 2 + jitter;
    const cur = rotation.get();
    const extra = (((-centre - cur) % 360) + 360) % 360;
    const target = cur + 360 * 5 + extra;
    setSpinning(true);
    animate(rotation, target, reduced ? { duration: 0 } : { duration: 4.8, ease: [0.12, 0.7, 0.14, 1] }).then(() => {
      setSpinning(false);
      setResult(idx);
      haptic([30, 40, 30] as unknown as number);
    });
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 overflow-y-auto bg-black/85 px-4 py-6 text-center text-paper"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      role="dialog"
      aria-label={S.end.dare}
    >
      <h2 className="font-display text-3xl font-bold">{S.end.dareFor(names)}</h2>

      <div className="relative w-72 max-w-full">
        {/* pointer */}
        <svg viewBox="0 0 40 40" className="absolute left-1/2 -top-3 z-10 h-9 w-9 -translate-x-1/2 drop-shadow-md" aria-hidden>
          <path d="M20 38 6 8h28z" fill="#f4f0e0" stroke="#1c1108" strokeWidth="3" strokeLinejoin="round" />
        </svg>
        <motion.svg viewBox="0 0 200 200" className="block w-full drop-shadow-[0_10px_18px_rgb(0_0_0/0.6)]" style={{ rotate: rotation }}>
          <circle cx="100" cy="100" r="99" fill="#1c1108" />
          {DARES.map((d, i) => {
            const [tx, ty] = polar(i * SEG + SEG / 2, 66);
            return (
              <g key={i}>
                <path d={wedge(i)} fill={WHEEL_COLORS[i % WHEEL_COLORS.length]} stroke="#f4f0e0" strokeWidth="1.5" />
                <text
                  x={tx} y={ty} textAnchor="middle" dominantBaseline="middle"
                  transform={`rotate(${i * SEG + SEG / 2} ${tx} ${ty})`}
                  fontFamily="Baloo Chettan 2, sans-serif" fontWeight="700" fontSize="9.5" fill="#fff"
                >
                  {d.short}
                </text>
              </g>
            );
          })}
          <circle cx="100" cy="100" r="13" fill="#f4f0e0" stroke="#1c1108" strokeWidth="3" />
        </motion.svg>
      </div>

      <div className="flex min-h-28 w-full max-w-sm flex-col items-center justify-center">
        {result !== null ? (
          <motion.div
            className="paper w-full rounded-lg p-4 text-ink"
            initial={reduced ? false : { scale: 0.7, opacity: 0, rotate: -4 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 16 }}
          >
            <p className="font-ml text-sm">{S.end.dareResult}</p>
            <p className="font-display text-2xl font-bold text-stamp">{DARES[result].short}</p>
            <p className="mt-1 font-hand text-lg">{DARES[result].text}</p>
          </motion.div>
        ) : (
          <p className="font-ml text-lg">{spinning ? S.end.spinning : ""}</p>
        )}
      </div>

      <div className="flex w-full max-w-sm gap-3">
        <Button className="flex-1" disabled={spinning} onClick={spin}>
          {result === null ? S.end.spin : S.end.respin}
        </Button>
        <Button variant="ghost" className="flex-1" disabled={spinning} onClick={onClose}>
          {S.end.close}
        </Button>
      </div>
    </motion.div>
  );
}
