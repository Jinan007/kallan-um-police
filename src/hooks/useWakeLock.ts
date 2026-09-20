import { useEffect } from "react";

interface Sentinel {
  release: () => Promise<void>;
}

/**
 * Keeps the phone screen awake while `active`, so it does not dim in the middle of a round.
 * The browser drops the lock whenever the tab is hidden, so it is asked for again on return.
 * Browsers without the Screen Wake Lock API just ignore this.
 */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    const wakeLock = (navigator as unknown as { wakeLock?: { request: (t: "screen") => Promise<Sentinel> } }).wakeLock;
    if (!active || !wakeLock) return;
    let sentinel: Sentinel | null = null;
    let cancelled = false;

    const acquire = () => {
      if (document.visibilityState !== "visible") return;
      wakeLock
        .request("screen")
        .then((s) => (cancelled ? void s.release() : (sentinel = s)))
        .catch(() => undefined); // denied (battery saver etc.): the game still works
    };
    acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", acquire);
      void sentinel?.release().catch(() => undefined);
    };
  }, [active]);
}
