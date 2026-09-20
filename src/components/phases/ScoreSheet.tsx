import { motion, useReducedMotion } from "motion/react";
import { useEffect } from "react";
import { play } from "../../audio/sound";
import { S } from "../../config/strings";
import type { GameState } from "../../game/reducer";
import { HandwrittenNumber, writeTime } from "../fx/HandwrittenNumber";
import { Paper } from "../layout/Screen";

const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

/** When each part of the newest round gets written, in seconds after the sheet appears. */
export const SCORE_TIMING = { first: 0.35, perDelta: 0.4, lineGap: 0.45, totalsGap: 0.3, perTotal: 0.35 } as const;

/**
 * Ruled-notebook scoreboard. Rounds are written downwards, one row each, with a running-total line
 * at the bottom. With `writeNewest`, the newest round's points are handwritten one by one, then the
 * pen draws a line and writes the new totals under it, with a scratchy pen sound for each number.
 * Earlier rounds are already on the page. Scrolls sideways inside the sheet (never the page)
 * when there are many players.
 */
export function ScoreSheet({ s, writeNewest = false }: { s: GameState; writeNewest?: boolean }) {
  const reduced = useReducedMotion();
  const n = s.players.length;
  const last = s.history.length - 1;
  const live = writeNewest && !reduced;

  const T = SCORE_TIMING;
  const lineAt = T.first + n * T.perDelta + T.lineGap;
  const totalsAt = lineAt + T.totalsGap;

  useEffect(() => {
    if (!live || last < 0) return;
    const ids: number[] = [];
    for (let i = 0; i < n; i++) ids.push(window.setTimeout(() => play("pen", { duration: 0.7 }), (T.first + i * T.perDelta) * 1000));
    for (let i = 0; i < n; i++) ids.push(window.setTimeout(() => play("pen", { duration: 0.55 }), (totalsAt + i * T.perTotal) * 1000));
    return () => ids.forEach(clearTimeout);
    // the schedule depends only on these
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, last, n]);

  return (
    <Paper className="overflow-x-auto p-0">
      <table className="w-full min-w-max border-collapse text-center text-sm [&_td]:h-8 [&_td]:px-1.5 [&_th]:px-1.5">
        <thead>
          <tr className="font-display">
            <th className="text-left">{S.score.round}</th>
            {s.players.map((name, i) => (
              <th key={i} className="max-w-14 truncate">{name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {s.history.map((row, r) => {
            const fresh = live && r === last;
            return (
              <tr key={r}>
                <td className="text-left font-display">{r + 1}</td>
                {row.map((d, i) => (
                  <td key={i} className={d < 0 ? "text-stamp" : ""}>
                    <HandwrittenNumber text={signed(d)} animate={fresh} delay={T.first + i * T.perDelta} />
                  </td>
                ))}
              </tr>
            );
          })}
          <tr>
            <td colSpan={n + 1} className="!h-1 !p-0">
              {/* the pen draws the total line: a bar that grows from the left */}
              <motion.div
                className="h-0.5 origin-left bg-ink"
                initial={live ? { scaleX: 0 } : false}
                animate={{ scaleX: 1 }}
                transition={{ delay: lineAt, duration: 0.4, ease: "easeInOut" }}
              />
            </td>
          </tr>
          <tr className="font-display text-base font-bold">
            <td className="text-left">{S.score.total}</td>
            {s.totals.map((t, i) => (
              <td key={i}>
                <HandwrittenNumber text={String(t)} animate={live} delay={totalsAt + i * T.perTotal} />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </Paper>
  );
}

/** Seconds until everything on the sheet is written. */
export const scoreSheetDuration = (players: number) =>
  SCORE_TIMING.first + players * SCORE_TIMING.perDelta + SCORE_TIMING.lineGap + SCORE_TIMING.totalsGap +
  players * SCORE_TIMING.perTotal + writeTime("00000");
