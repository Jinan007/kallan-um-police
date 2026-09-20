import type { HTMLAttributes, ReactNode } from "react";

/** Full-height column with safe-area padding; every phase renders inside one. */
export function Screen({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <main className="mx-auto flex h-full max-w-md flex-col gap-4 overflow-y-auto bg-sepia px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
      {title && <h1 className="font-display text-3xl font-bold leading-tight">{title}</h1>}
      {children}
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
