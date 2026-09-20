import { useSyncExternalStore } from "react";
import { isMuted, setMuted, subscribe } from "../../audio/sound";
import { S } from "../../config/strings";
import { haptic } from "../../hooks/useHold";

const round =
  "pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-paper transition-transform duration-100 active:scale-90";
const icon = { viewBox: "0 0 24 24", className: "h-6 w-6", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true } as const;

interface Props {
  film: boolean;
  onFilm: (on: boolean) => void;
}

/** Top-right buttons on every screen: film look on/off and sound on/off. Both are remembered. */
export function Controls({ film, onFilm }: Props) {
  const muted = useSyncExternalStore(subscribe, isMuted);
  return (
    <div className="pointer-events-none fixed right-2 top-[max(0.5rem,env(safe-area-inset-top))] z-[70] flex gap-2">
      <button
        type="button"
        aria-label={film ? S.common.filmOff : S.common.filmOn}
        aria-pressed={film}
        className={`${round} ${film ? "" : "opacity-60"}`}
        onClick={() => {
          haptic();
          onFilm(!film);
        }}
      >
        <svg {...icon}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" />
          {!film && <path d="m4 20 16-16" />}
        </svg>
      </button>
      <button
        type="button"
        aria-label={muted ? S.common.unmute : S.common.mute}
        aria-pressed={muted}
        className={round}
        onClick={() => {
          haptic();
          setMuted(!muted);
        }}
      >
        <svg {...icon}>
          <path d="M11 5 6 9H2v6h4l5 4z" fill="currentColor" />
          {muted ? (
            <path d="m16 9 6 6m0-6-6 6" />
          ) : (
            <>
              <path d="M15.5 8.5a5 5 0 0 1 0 7" />
              <path d="M18.5 5.5a9 9 0 0 1 0 13" />
            </>
          )}
        </svg>
      </button>
    </div>
  );
}
