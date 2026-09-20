import type { ButtonHTMLAttributes } from "react";
import { haptic } from "../../hooks/useHold";

type Variant = "primary" | "ghost" | "danger";

const styles: Record<Variant, string> = {
  primary: "bg-ink text-paper shadow-[0_3px_0_#12244a]",
  ghost: "bg-paper text-ink border-2 border-ink shadow-[0_3px_0_rgb(0_0_0/0.25)]",
  danger: "bg-stamp text-paper shadow-[0_3px_0_#7a1913]",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

/** 48px+ target. Feedback fires on pointerdown so it lands well inside 100ms. */
export function Button({ variant = "primary", className = "", onPointerDown, ...rest }: Props) {
  return (
    <button
      {...rest}
      onPointerDown={(e) => {
        if (!rest.disabled) haptic();
        onPointerDown?.(e);
      }}
      className={`min-h-12 rounded-xl px-5 py-2 font-display text-lg font-bold transition-transform duration-100 active:scale-95 active:translate-y-0.5 disabled:opacity-40 ${styles[variant]} ${className}`}
    />
  );
}
