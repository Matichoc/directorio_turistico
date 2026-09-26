import type { ReactNode } from "react";
import { SparkleField } from "@/components/ui/sparkle-field";

/**
 * Cabecera oscura con chispas y halo, reutilizada en toda página de
 * contenido (no solo el home) — pedido del usuario: "todo el sitio debe
 * conservar la mística de la zona". Antes esto vivía solo en el hero del
 * home (ver docs/DESIGN.md); esta es la fuente única ahora para que
 * agregar una página nueva la herede automático en vez de copiar el
 * gradiente a mano cada vez.
 *
 * A diferencia del hero del home (a todo el ancho, se funde con el fondo
 * de la página), esta es una tarjeta contenida — las páginas de contenido
 * usan `main` con su padding normal, no full-bleed.
 */
export function PageHero({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1b0e1f] via-[#2a1420] to-[#1b0e1f] px-5 py-6 text-white">
      <SparkleField />
      <div className="bg-accent animate-glow-pulse pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-40 blur-3xl" />
      <div className="relative flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {subtitle && <p className="text-sm text-white/70">{subtitle}</p>}
        {children}
      </div>
    </header>
  );
}
