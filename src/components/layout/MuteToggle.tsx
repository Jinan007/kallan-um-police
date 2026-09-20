import { useSyncExternalStore } from "react";
import { isMuted, setMuted, subscribe } from "../../audio/sound";
import { S } from "../../config/strings";
import { haptic } from "../../hooks/useHold";

/** Speaker on/off, top right on every screen. The choice is remembered. */
export function MuteToggle() {
  const muted = useSyncExternalStore(subscribe, isMuted);
  return (
    <button
      type="button"
      aria-label={muted ? S.common.unmute : S.common.mute}
      aria-pressed={muted}
      onClick={() => {
        haptic();
        setMuted(!muted);
      }}
      className="pointer-events-auto fixed right-2 top-[max(0.5rem,env(safe-area-inset-top))] z-40 flex h-11 w-11 items-center justify-center rounded-full bg-black/40 text-paper transition-transform duration-100 active:scale-90"
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
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
  );
}
