import { S } from "../../config/strings";
import type { GameState } from "../../game/reducer";
import { Paper } from "../layout/Screen";

const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

/**
 * Ruled-notebook scoreboard. Rounds are written downwards, one row each,
 * with a running-total line at the bottom. Scrolls sideways inside the sheet
 * (never the page) when there are many players.
 */
export function ScoreSheet({ s }: { s: GameState }) {
  return (
    <Paper className="overflow-x-auto p-0">
      <table className="w-full min-w-max border-collapse text-center text-base [&_td]:h-7 [&_td]:px-2 [&_th]:px-2">
        <thead>
          <tr className="font-display">
            <th className="text-left">{S.score.round}</th>
            {s.players.map((name, i) => (
              <th key={i} className="max-w-20 truncate">{name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {s.history.map((row, r) => (
            <tr key={r}>
              <td className="text-left font-display">{r + 1}</td>
              {row.map((d, i) => (
                <td key={i} className={d < 0 ? "text-stamp" : ""}>{signed(d)}</td>
              ))}
            </tr>
          ))}
          <tr className="border-t-2 border-ink font-display text-lg font-bold">
            <td className="text-left">{S.score.total}</td>
            {s.totals.map((t, i) => (
              <td key={i}>{t}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </Paper>
  );
}
