import type { HTMLAttributes, ReactNode } from "react";

interface ScreenProps {
  children: ReactNode;
  title?: string;
  /** "table" = dark walnut room (shuffle/pick); "paper" = sepia. */
  tone?: "paper" | "table";
}

/**
 * Full-height column, everything centred both ways. The inner wrapper uses my-auto
 * (not justify-center) so tall content scrolls from the top instead of being clipped.
 */
export function Screen({ children, title, tone = "paper" }: ScreenProps) {
  return (
    <main
      className={`mx-auto flex h-full max-w-md flex-col overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] ${
        tone === "table" ? "wood-room text-paper" : "sepia-bg"
      }`}
    >
      <div className="my-auto flex w-full flex-col gap-4 text-center">
        {title && <h1 className="font-display text-3xl font-bold leading-tight">{title}</h1>}
        {children}
      </div>
    </main>
  );
}

export function Paper({ children, className = "", ...rest }: HTMLAttributes<HTMLElement>) {
  return (
    <section {...rest} className={`paper rounded-lg p-4 ${className}`}>
      {children}
    </section>
  );
}
