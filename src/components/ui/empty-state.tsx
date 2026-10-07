import type { ReactNode } from "react";

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="text-foreground/60 surface-glass rounded-xl border-dashed p-6 text-center text-sm"
    >
      {children}
    </div>
  );
}
