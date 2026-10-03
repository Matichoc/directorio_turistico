import type { ReactNode } from "react";
import { SparkleField } from "@/components/ui/sparkle-field";
import { SCENE_SRC, type SceneId } from "@/lib/ui/scene-backgrounds";

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
  scene,
  children,
}: {
  title: string;
  subtitle?: string;
  /** Fondo ilustrado con el diablito (ver `lib/ui/scene-backgrounds.ts`). */
  scene?: SceneId;
  children?: ReactNode;
}) {
  return (
    <header
      className={`surface-glass relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#140b1f]/90 via-[#1d0f22]/80 to-[#0b1220]/90 px-5 py-7 text-white ${
        scene ? "min-h-56" : ""
      }`}
    >
      {scene && (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-cover [background-position:85%_70%]"
            style={{ backgroundImage: `url(${SCENE_SRC[scene]})` }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#07060c]/90 via-[#07060c]/50 to-transparent"
          />
        </>
      )}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [mask-image:linear-gradient(to_bottom,#000,transparent_85%)] [background-size:28px_28px] opacity-60"
      />
      <SparkleField />
      <div className="bg-accent animate-glow-pulse pointer-events-none absolute -top-16 -right-14 h-52 w-52 rounded-full opacity-50 blur-3xl" />
      <div className="bg-neon animate-glow-pulse pointer-events-none absolute -bottom-16 -left-12 h-40 w-40 rounded-full opacity-35 blur-3xl [animation-delay:-2s]" />
      <div className="bg-neon-2 animate-glow-pulse pointer-events-none absolute top-1/2 left-1/2 h-24 w-24 rounded-full opacity-15 blur-3xl [animation-delay:-3s]" />
      <div
        aria-hidden="true"
        className="via-accent pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent"
      />
      <div
        className={`relative flex flex-col gap-1.5 ${scene ? "max-w-[65%]" : ""}`}
      >
        <h1 className="text-gradient text-3xl font-semibold tracking-tight">
          {title}
        </h1>
        {subtitle && <p className="text-sm text-white/80">{subtitle}</p>}
        {children}
      </div>
    </header>
  );
}
