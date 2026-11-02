import type { ReactNode } from "react";
import { HtmlShell } from "@/components/ui/html-shell";
import { AdminShell } from "./admin-shell";

/**
 * El panel depende de quién entra: siempre se arma en el momento, nunca se
 * cachea (antes lo forzaba sin querer el `getLocale()` del layout raíz).
 */
export const dynamic = "force-dynamic";

/**
 * El panel es solo en español. El `<html>` va acá (no en `app/layout.tsx`,
 * ver `HtmlShell`); el menú y la sesión siguen en `AdminShell` (cliente).
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <HtmlShell lang="es">
      <AdminShell>{children}</AdminShell>
    </HtmlShell>
  );
}
