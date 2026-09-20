import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import { DARES, WHEEL_COLORS } from "../../config/dares";
import type { Dare } from "../../config/dares";
import { S } from "../../config/strings";
import { DARE_LIMITS, loadDares, sanitizeDares, saveDares } from "../../game/dares";
import { haptic } from "../../hooks/useHold";
import { Button } from "../layout/Button";

const R = 84; // wedge radius; the rim and lights sit outside it

const polar = (deg: number, r: number) => {
  const a = ((deg - 90) * Math.PI) / 180; // 0 deg = straight up
  return [100 + r * Math.cos(a), 100 + r * Math.sin(a)] as const;
};

/** The wheel itself: rim with lights, wedges, gloss and hub. Pure drawing; the parent rotates it. */
function WheelDisc({ dares }: { dares: readonly Dare[] }) {
  const seg = 360 / dares.length;
  const wedge = (i: number) => {
    const [x1, y1] = polar(i * seg, R);
    const [x2, y2] = polar((i + 1) * seg, R);
    return `M100 100 L${x1} ${y1} A${R} ${R} 0 0 1 ${x2} ${y2} Z`;
  };
  const fontSize = dares.length > 10 ? 7.5 : dares.length > 7 ? 9 : 10.5;
  return (
    <>
      <defs>
        <linearGradient id="rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6d46a" />
          <stop offset="0.5" stopColor="#a87a1c" />
          <stop offset="1" stopColor="#5a3d0a" />
        </linearGradient>
        <radialGradient id="gloss" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#fff" stopOpacity="0.32" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.28" />
        </radialGradient>
        <radialGradient id="hub" cx="0.35" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#fffbe8" />
          <stop offset="1" stopColor="#b59a4a" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="99" fill="url(#rim)" />
      <circle cx="100" cy="100" r="91" fill="#24160a" />
      {dares.map((d, i) => {
        const [tx, ty] = polar(i * seg + seg / 2, R * 0.66);
        const [lx, ly] = polar(i * seg, 95);
        return (
          <g key={i}>
            <path d={wedge(i)} fill={WHEEL_COLORS[i % WHEEL_COLORS.length]} stroke="#f4f0e0" strokeWidth="1.2" />
            <text
              x={tx} y={ty} textAnchor="middle" dominantBaseline="middle"
              transform={`rotate(${i * seg + seg / 2} ${tx} ${ty})`}
              fontFamily="Baloo Chettan 2, sans-serif" fontWeight="700" fontSize={fontSize} fill="#fff"
              stroke="rgb(0 0 0 / 0.35)" strokeWidth="0.4" paintOrder="stroke"
            >
              {d.short}
            </text>
            <circle cx={lx} cy={ly} r="2.1" fill="#fff6c8" stroke="#8a6a12" strokeWidth="0.6" />
          </g>
        );
      })}
      <circle cx="100" cy="100" r={R} fill="url(#gloss)" />
      <circle cx="100" cy="100" r="14" fill="url(#hub)" stroke="#24160a" strokeWidth="3" />
    </>
  );
}

interface Row extends Dare { id: number }

/** Edit the wheel: rename, rewrite, add, remove, reset. Saved to this device. */
function DareEditor({ dares, onSave, onCancel }: { dares: Dare[]; onSave: (d: Dare[]) => void; onCancel: () => void }) {
  const nextId = useRef(0);
  const withId = (d: Dare): Row => ({ ...d, id: nextId.current++ });
  const [rows, setRows] = useState<Row[]>(() => dares.map(withId));

  const patch = (id: number, p: Partial<Dare>) => setRows((r) => r.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const clean = sanitizeDares(rows);
  const input = "min-h-11 min-w-0 rounded-lg border-2 border-paper/30 bg-black/40 px-3 text-center font-hand text-lg text-paper outline-none focus:border-paper";

  return (
    <div className="flex h-full w-full max-w-md flex-col gap-3">
      <h2 className="font-display text-2xl font-bold">{S.end.editHeading}</h2>
      <p className="font-ml text-sm opacity-80">{S.end.editHint}</p>
      <ul className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
        {rows.map((r) => (
          <li key={r.id} className="flex items-start gap-2 rounded-xl bg-white/5 p-2">
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <input
                className={input} value={r.short} maxLength={DARE_LIMITS.labelMax}
                placeholder={S.end.labelPlaceholder} aria-label={S.end.labelPlaceholder}
                onChange={(e) => patch(r.id, { short: e.target.value })}
              />
              <input
                className={input} value={r.text} maxLength={DARE_LIMITS.textMax}
                placeholder={S.end.darePlaceholder} aria-label={S.end.darePlaceholder}
                onChange={(e) => patch(r.id, { text: e.target.value })}
              />
            </div>
            <Button
              variant="ghost" aria-label={S.end.removeDare} disabled={rows.length <= DARE_LIMITS.min}
              onClick={() => setRows((x) => x.filter((y) => y.id !== r.id))}
            >
              ✕
            </Button>
          </li>
        ))}
      </ul>
      {!clean && <p role="alert" className="font-ml text-sm text-[#ff9b93]">{S.end.minDares(DARE_LIMITS.min)}</p>}
      <div className="flex gap-2">
        <Button variant="ghost" className="flex-1" disabled={rows.length >= DARE_LIMITS.max}
          onClick={() => setRows((r) => [...r, withId({ short: "", text: "" })])}>
          + {S.end.addDare}
        </Button>
        <Button variant="ghost" className="flex-1" onClick={() => setRows(DARES.map(withId))}>{S.end.resetDares}</Button>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={onCancel}>{S.end.cancel}</Button>
        <Button className="flex-1" disabled={!clean} onClick={() => clean && onSave(clean)}>{S.end.saveDares}</Button>
      </div>
    </div>
  );
}

/**
 * Wheel of dares for the last-place player(s). Spinning is one `rotate` animation with a long
 * ease-out. The winning wedge is picked first, then the spin is aimed so that wedge stops under
 * the pointer at the top: rotation = -(wedge centre angle) modulo 360.
 */
export function DareWheel({ names, onClose }: { names: string; onClose: () => void }) {
  const reduced = !!useReducedMotion();
  const rotation = useMotionValue(0);
  const [dares, setDares] = useState<Dare[]>(loadDares);
  const [editing, setEditing] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const last = useRef<number | null>(null);

  const spin = () => {
    if (spinning) return;
    haptic(20);
    setResult(null);
    const seg = 360 / dares.length;
    let idx = Math.floor(Math.random() * dares.length);
    if (dares.length > 1 && idx === last.current) idx = (idx + 1) % dares.length; // no instant repeat
    last.current = idx;
    const centre = idx * seg + seg / 2 + (Math.random() - 0.5) * seg * 0.7; // anywhere inside the wedge
    const cur = rotation.get();
    const extra = (((-centre - cur) % 360) + 360) % 360;
    setSpinning(true);
    animate(rotation, cur + 360 * 5 + extra, reduced ? { duration: 0 } : { duration: 4.8, ease: [0.12, 0.7, 0.14, 1] }).then(() => {
      setSpinning(false);
      setResult(idx);
      haptic(40);
    });
  };

  const save = (next: Dare[]) => {
    saveDares(next);
    setDares(next);
    setResult(null);
    last.current = null;
    setEditing(false);
  };

  return (
    <motion.div
      className="pointer-events-auto fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 overflow-y-auto bg-[#120b05]/97 px-4 py-6 text-center text-paper"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      role="dialog"
      aria-label={S.end.dare}
    >
      {editing ? (
        <DareEditor dares={dares} onSave={save} onCancel={() => setEditing(false)} />
      ) : (
        <>
          <h2 className="font-display text-3xl font-bold leading-tight">{S.end.dareFor(names)}</h2>

          <div className="relative w-[min(78vw,20rem)]">
            {/* pointer: a flapper that sits over the rim */}
            <svg viewBox="0 0 40 44" className="absolute left-1/2 -top-4 z-10 h-11 w-10 -translate-x-1/2 drop-shadow-[0_3px_3px_rgb(0_0_0/0.6)]" aria-hidden>
              <path d="M20 42 5 10a16 16 0 0 1 30 0z" fill="#f4f0e0" stroke="#24160a" strokeWidth="3" strokeLinejoin="round" />
              <circle cx="20" cy="12" r="4" fill="#b3261e" />
            </svg>
            <motion.svg viewBox="0 0 200 200" className="block w-full drop-shadow-[0_14px_20px_rgb(0_0_0/0.7)]" style={{ rotate: rotation }}>
              <WheelDisc dares={dares} />
            </motion.svg>
            {/* The hub is the spin button. It does not rotate with the wheel. */}
            <button
              type="button"
              onClick={spin}
              disabled={spinning}
              aria-label={result === null ? S.end.spin : S.end.respin}
              onPointerDown={() => !spinning && haptic()}
              className="absolute left-1/2 top-1/2 flex h-[27%] w-[27%] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-[#24160a] font-display text-base font-bold leading-none text-[#5a3d0a] shadow-[0_3px_6px_rgb(0_0_0/0.6),inset_0_2px_3px_rgb(255_255_255/0.7)] transition-transform duration-100 active:scale-90 disabled:opacity-70"
              style={{ background: "radial-gradient(circle at 35% 30%, #fffbe8, #d9be6a 70%, #a98a3a)" }}
            >
              {spinning ? "..." : result === null ? S.end.spin : "AGAIN"}
            </button>
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
                <p className="font-display text-2xl font-bold text-stamp">{dares[result].short}</p>
                <p className="mt-1 font-hand text-lg">{dares[result].text}</p>
              </motion.div>
            ) : (
              <p className="font-ml text-lg">{spinning ? S.end.spinning : ""}</p>
            )}
          </div>

          <div className="flex w-full max-w-sm flex-col gap-2">
            <p className="font-ml text-sm opacity-80">{S.end.tapHub}</p>
            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" disabled={spinning} onClick={() => setEditing(true)}>{S.end.editWheel}</Button>
              <Button variant="ghost" className="flex-1" disabled={spinning} onClick={onClose}>{S.end.close}</Button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
