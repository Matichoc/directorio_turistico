"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

/**
 * Los filtros de `/explorar` quedan plegados detrás de un botón (pedido del
 * usuario: que se desplieguen "solo si los quisiera usar") para que el árbol
 * comuna → pueblo sea lo primero que se ve. `activeCount` en el botón avisa
 * que hay filtros aplicados aunque el panel esté cerrado.
 */
export function FiltersDisclosure({
  activeCount,
  children,
}: {
  activeCount: number;
  children: ReactNode;
}) {
  const t = useTranslations("explore");
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="border-accent-soft hover:border-accent flex w-fit items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-all dark:border-white/10"
      >
        {t("filtersButton")}
        {activeCount > 0 && (
          <span className="bg-accent text-accent-foreground rounded-full px-2 text-xs">
            {activeCount}
          </span>
        )}
      </button>
      {open && children}
    </div>
  );
}
