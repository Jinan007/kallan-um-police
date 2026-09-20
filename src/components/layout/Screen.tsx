import type { HTMLAttributes, ReactNode } from "react";

interface ScreenProps {
  children?: ReactNode;
  title?: string;
  /**
   * "paper": sepia page. "table": a translucent layer over the wooden table (the table is
   * mounted behind it by App). `scrim` sets how dark that layer is.
   */
  tone?: "paper" | "table";
  scrim?: "dim" | "light";
}

const pad = "px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]";

/**
 * Everything centred both ways. The inner wrapper uses my-auto (not justify-center)
 * so tall content scrolls from the top instead of being clipped.
 */
export function Screen({ children, title, tone = "paper", scrim = "dim" }: ScreenProps) {
  const heading = title && (
    <h1 className="font-display text-3xl font-bold leading-tight">{title}</h1>
  );

  if (tone === "table") {
    return (
      // pointer-events-none: taps fall through to the chits; real controls opt back in
      <div className="pointer-events-none fixed inset-0 z-10 text-paper">
        {/* The scrim reaches past the screen edges so a screen shake never exposes a gap at the corners. */}
        <div aria-hidden className={`absolute -inset-10 ${scrim === "light" ? "scrim-light" : "scrim-dim"}`} />
        <main className={`relative mx-auto flex h-full max-w-md flex-col overflow-y-auto ${pad}`}>
          {heading && <div className="text-center [text-shadow:0_2px_6px_rgb(0_0_0/0.7)]">{heading}</div>}
          <div className="my-auto flex w-full flex-col gap-4 text-center">{children}</div>
        </main>
      </div>
    );
  }
  return (
    <main className={`sepia-bg mx-auto flex h-full max-w-md flex-col overflow-y-auto ${pad}`}>
      <div className="my-auto flex w-full flex-col gap-4 text-center">
        {heading}
        {children}
      </div>
    </main>
  );
}

export function Paper({ children, className = "", ...rest }: HTMLAttributes<HTMLElement>) {
  return (
    <section {...rest} className={`paper pointer-events-auto rounded-lg p-4 text-ink ${className}`}>
      {children}
    </section>
  );
}
