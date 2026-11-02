"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import type { Sponsor } from "@/types/domain";

const AUTO_ADVANCE_MS = 8000;

/**
 * Auspiciadores del banner — antes un solo slot fijo (Matichoc,
 * hardcodeado por env vars), ahora una lista real (`sponsors` +
 * `sponsor_translations`, ver migración `0016_sponsors.sql`) que rota si
 * hay más de uno (pedido del usuario: "Poner el segundo auspiciador en el
 * banner"). Mismo patrón de auto-avance + puntos que `MunicipalityBanner`.
 *
 * Matichoc conserva a propósito su identidad visual real (colores de
 * marca vía los tokens `--sponsor*`, ver docs/DESIGN.md) — el resto de
 * los auspiciadores usa la paleta estándar del sitio (`--accent`), para
 * no inventarles un color de marca a mano que no verificamos.
 *
 * Siempre a la vista al moverse por la página, pero "más disimulado" que el
 * bloque de dos filas que había al final de cada página (pedido del
 * usuario). Dos formas, según el espacio libre:
 * - Celular y pantallas medianas: franja delgada (~44 px) fija abajo; la
 *   apila `[locale]/layout.tsx` sobre la barra de secciones.
 * - Escritorio (`lg`): barrita de ~1,5 cm fija al costado derecho, en el
 *   espacio que el contenido (768 px) deja libre, con los logos de todos los
 *   auspiciadores; así no le quita alto a la página.
 * Sin `backdrop-filter`: pasa encima del vuelo 3D (DESIGN.md, "Fluidez").
 */
export function SponsorBanner({ sponsors }: { sponsors: Sponsor[] }) {
  const t = useTranslations("common");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (sponsors.length <= 1) return;
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % sponsors.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [sponsors.length]);

  if (sponsors.length === 0) return null;

  const sponsor = sponsors[index];
  const isMatichoc = sponsor.slug === "matichoc";
  const primaryUrl = sponsor.websiteUrl ?? sponsor.instagramUrl;
  const showInstagramPill =
    sponsor.instagramUrl && sponsor.instagramUrl !== primaryUrl;

  const dots = sponsors.length > 1 && (
    <div className="flex shrink-0 items-center gap-1">
      {sponsors.map((candidate, candidateIndex) => (
        <button
          key={candidate.id}
          type="button"
          onClick={() => setIndex(candidateIndex)}
          aria-label={candidate.name}
          aria-current={candidateIndex === index}
          className={`h-1.5 rounded-full transition-all ${
            candidateIndex === index
              ? `w-3 ${isMatichoc ? "bg-sponsor-accent" : "bg-accent"}`
              : `w-1.5 ${isMatichoc ? "bg-sponsor-accent/30" : "bg-accent-soft"}`
          }`}
        />
      ))}
    </div>
  );

  const label = (
    <span
      className={`text-[10px] font-semibold tracking-wide whitespace-nowrap uppercase ${
        isMatichoc ? "text-sponsor-accent" : "text-accent"
      }`}
    >
      {t("sponsoredBy")}
    </span>
  );
  const taglineTone = isMatichoc
    ? "text-sponsor-foreground/80"
    : "text-foreground/70";
  const instagramTone = isMatichoc
    ? "border-sponsor-accent/40 text-sponsor-accent hover:bg-sponsor-accent/10"
    : "border-accent/40 text-accent hover:bg-accent/10";
  const ctaTone = isMatichoc
    ? "bg-sponsor-accent text-sponsor-accent-foreground"
    : "bg-accent text-accent-foreground";
  const surfaceTone = isMatichoc
    ? "bg-sponsor/95 border-sponsor-accent/50"
    : "bg-background/95 border-accent/50";

  const instagramLink = (className: string) =>
    showInstagramPill && (
      <a
        href={sponsor.instagramUrl!}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={`rounded-full border text-[11px] font-medium ${instagramTone} ${className}`}
      >
        {t("sponsor.instagram")}
      </a>
    );
  const ctaLink = (className: string) =>
    primaryUrl && (
      <a
        href={primaryUrl}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={`rounded-full text-[11px] font-semibold transition-transform hover:scale-105 ${ctaTone} ${className}`}
      >
        {t("sponsor.cta")}
      </a>
    );

  return (
    <>
      {/* Franja: celular y pantallas medianas. */}
      <div
        className={`border-t shadow-[0_-4px_16px_-6px_rgba(0,0,0,0.45)] lg:hidden ${surfaceTone}`}
      >
        <div className="mx-auto flex max-w-3xl items-center gap-2.5 px-4 py-1.5">
          <Image
            src={sponsor.logoPath}
            alt={sponsor.name}
            width={2000}
            height={2000}
            // Se ve a 32 px: sin `sizes` el
            // navegador pedía la versión de 3840 px en cada página.
            sizes="128px"
            className="h-8 w-auto shrink-0 rounded-md"
          />
          <div className="flex min-w-0 flex-1 flex-col leading-tight">
            {label}
            <span className={`truncate text-xs ${taglineTone}`}>
              {sponsor.tagline ?? sponsor.name}
            </span>
          </div>
          {dots}
          {instagramLink("hidden shrink-0 px-3 py-1 sm:inline-flex")}
          {ctaLink("shrink-0 px-3 py-1")}
        </div>
      </div>

      {/* Barrita al costado: escritorio. ~1,5 cm de ancho (pedido del
          usuario: la columna ancha "está muy grande"), todo el alto libre a
          la derecha y los logos de todos los auspiciadores a la vez, cada
          uno con su link; el nombre y la frase van en el `title`. */}
      <aside className="bg-background/90 fixed top-[4.5rem] right-3 bottom-3 hidden w-14 flex-col items-center gap-4 rounded-2xl border border-white/10 py-4 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.6)] lg:flex">
        <span className="text-foreground/50 rotate-180 text-[9px] font-semibold tracking-[0.2em] whitespace-nowrap uppercase [writing-mode:vertical-rl]">
          {t("sponsoredBy")}
        </span>
        <ul className="flex flex-1 flex-col items-center justify-center gap-3">
          {sponsors.map((candidate) => {
            const url = candidate.websiteUrl ?? candidate.instagramUrl;
            const title = candidate.tagline
              ? `${candidate.name} — ${candidate.tagline}`
              : candidate.name;
            const logo = (
              <Image
                src={candidate.logoPath}
                alt={candidate.name}
                width={2000}
                height={2000}
                sizes="80px"
                className="h-10 w-10 rounded-lg object-contain transition-transform group-hover:scale-110"
              />
            );
            return (
              <li key={candidate.id}>
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer sponsored"
                    title={title}
                    className="group block rounded-lg hover:shadow-[0_0_14px_2px_var(--accent-soft)]"
                  >
                    {logo}
                  </a>
                ) : (
                  <span title={title} className="block">
                    {logo}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </aside>
    </>
  );
}
