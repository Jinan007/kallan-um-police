import { useState } from "react";
import { DEFAULT_MODE, LIMITS, WRONG_GUESS_MODES } from "../../config/rules";
import type { WrongGuessMode } from "../../config/rules";
import { S } from "../../config/strings";
import { Button } from "../layout/Button";
import { Paper, Screen } from "../layout/Screen";

interface Props {
  initialNames: string[];
  initialRounds: number;
  initialMode: WrongGuessMode;
  onStart: (players: string[], rounds: number, mode: WrongGuessMode) => void;
}

export function SetupScreen({ initialNames, initialRounds, initialMode, onStart }: Props) {
  const [names, setNames] = useState<string[]>(
    initialNames.length ? initialNames : Array.from({ length: LIMITS.minPlayers }, () => ""),
  );
  const [rounds, setRounds] = useState(initialRounds || LIMITS.defaultRounds);
  const [mode, setMode] = useState<WrongGuessMode>(initialMode || DEFAULT_MODE);

  const trimmed = names.map((n) => n.trim());
  const filled = trimmed.filter(Boolean);
  const hasDuplicate = new Set(filled.map((n) => n.toLowerCase())).size !== filled.length;
  const tooFew = filled.length < LIMITS.minPlayers;
  const error = tooFew ? S.setup.needMore(LIMITS.minPlayers) : hasDuplicate ? S.setup.duplicate : null;

  const setName = (i: number, v: string) => setNames((p) => p.map((n, j) => (j === i ? v : n)));

  return (
    <Screen title={S.setup.heading}>
      <Paper>
        <h2 className="font-display text-xl font-bold">{S.setup.playersLabel}</h2>
        <ul className="mt-2 flex flex-col gap-2">
          {names.map((n, i) => (
            <li key={i} className="flex gap-2">
              <input
                value={n}
                maxLength={LIMITS.maxNameLength}
                placeholder={S.setup.playerPlaceholder(i + 1)}
                onChange={(e) => setName(i, e.target.value)}
                className="min-h-12 min-w-0 flex-1 rounded-lg border-2 border-ink/40 bg-white/60 px-3 font-hand text-lg outline-none focus:border-ink"
              />
              {names.length > LIMITS.minPlayers && (
                <Button
                  variant="ghost"
                  aria-label={S.setup.removePlayer}
                  onClick={() => setNames((p) => p.filter((_, j) => j !== i))}
                >
                  ✕
                </Button>
              )}
            </li>
          ))}
        </ul>
        {names.length < LIMITS.maxPlayers && (
          <Button variant="ghost" className="mt-3 w-full" onClick={() => setNames((p) => [...p, ""])}>
            + {S.setup.addPlayer}
          </Button>
        )}
      </Paper>

      <Paper>
        <h2 className="font-display text-xl font-bold">{S.setup.roundsLabel}</h2>
        <div className="mt-2 flex items-center justify-between gap-3">
          <Button variant="ghost" disabled={rounds <= LIMITS.minRounds} onClick={() => setRounds((r) => r - 1)}>−</Button>
          <span className="font-display text-3xl font-bold">{rounds}</span>
          <Button variant="ghost" disabled={rounds >= LIMITS.maxRounds} onClick={() => setRounds((r) => r + 1)}>+</Button>
        </div>
      </Paper>

      <Paper>
        <h2 className="font-display text-xl font-bold">{S.setup.modeLabel}</h2>
        <div role="radiogroup" className="mt-2 flex flex-col gap-2">
          {(Object.keys(WRONG_GUESS_MODES) as WrongGuessMode[]).map((m) => (
            <button
              key={m}
              role="radio"
              aria-checked={mode === m}
              onClick={() => setMode(m)}
              className={`min-h-12 rounded-lg border-2 px-3 py-2 text-left transition-transform duration-100 active:scale-[0.98] ${
                mode === m ? "border-ink bg-ink text-paper" : "border-ink/40 bg-white/50"
              }`}
            >
              <span className="font-display text-lg font-bold">{S.modes[m].title}</span>
              <span className="block text-sm">{S.modes[m].desc}</span>
            </button>
          ))}
        </div>
      </Paper>

      {error && <p role="alert" className="font-ml text-stamp">{error}</p>}
      <Button disabled={!!error} onClick={() => onStart(trimmed.filter(Boolean), rounds, mode)}>
        {S.setup.start}
      </Button>
    </Screen>
  );
}
