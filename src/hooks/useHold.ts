import { useCallback, useRef, useState } from "react";

/** Short vibration; silently ignored where unsupported (iOS Safari, desktop). */
export function haptic(ms = 12): void {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* ignore */
  }
}

/**
 * Press-and-hold: `held` is true from pointerdown until release, cancel or leave.
 * Spread `bind` onto the element.
 */
export function useHold() {
  const [held, setHeld] = useState(false);
  const pointer = useRef<number | null>(null);

  const start = useCallback((e: React.PointerEvent) => {
    pointer.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    haptic(8);
    setHeld(true);
  }, []);
  const end = useCallback((e: React.PointerEvent) => {
    if (pointer.current !== e.pointerId) return;
    pointer.current = null;
    setHeld(false);
  }, []);

  const bind = {
    onPointerDown: start,
    onPointerUp: end,
    onPointerCancel: end,
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };
  return { held, bind };
}
