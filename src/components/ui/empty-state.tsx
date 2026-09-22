import type { ReactNode } from "react";

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p
      role="status"
      className="text-foreground/60 rounded-xl border border-dashed border-black/10 p-6 text-center text-sm dark:border-white/15"
    >
      {children}
    </p>
  );
}
