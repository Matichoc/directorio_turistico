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

  return (
    <div
      className={
        isMatichoc
          ? "bg-sponsor border-sponsor-accent border-t-4 px-4 py-3"
          : "bg-accent-soft border-accent border-t-4 px-4 py-3"
      }
    >
      <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Image
            src={sponsor.logoPath}
            alt={sponsor.name}
            width={2000}
            height={2000}
            className="h-14 w-auto shrink-0 rounded-lg sm:h-16"
          />
          <div className="flex flex-col leading-tight">
            <span
              className={`text-[11px] font-bold tracking-wide uppercase ${
                isMatichoc ? "text-sponsor-accent" : "text-accent"
              }`}
            >
              {t("sponsoredBy")}
            </span>
            {sponsor.tagline && (
              <span
                className={`text-xs ${
                  isMatichoc
                    ? "text-sponsor-foreground/80"
                    : "text-foreground/70"
                }`}
              >
                {sponsor.tagline}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showInstagramPill && (
            <a
              href={sponsor.instagramUrl!}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className={
                isMatichoc
                  ? "border-sponsor-accent/40 text-sponsor-accent hover:bg-sponsor-accent/10 rounded-full border px-3 py-1.5 text-xs font-medium"
                  : "border-accent/40 text-accent hover:bg-accent/10 rounded-full border px-3 py-1.5 text-xs font-medium"
              }
            >
              {t("sponsor.instagram")}
            </a>
          )}
          {primaryUrl && (
            <a
              href={primaryUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className={
                isMatichoc
                  ? "bg-sponsor-accent text-sponsor-accent-foreground rounded-full px-4 py-1.5 text-xs font-semibold shadow-sm transition-transform hover:scale-105"
                  : "bg-accent text-accent-foreground rounded-full px-4 py-1.5 text-xs font-semibold shadow-sm transition-transform hover:scale-105"
              }
            >
              {t("sponsor.cta")}
            </a>
          )}
        </div>
      </div>

      {sponsors.length > 1 && (
        <div className="mx-auto mt-2 flex max-w-3xl items-center gap-1.5">
          {sponsors.map((candidate, candidateIndex) => (
            <button
              key={candidate.id}
              type="button"
              onClick={() => setIndex(candidateIndex)}
              aria-label={candidate.name}
              aria-current={candidateIndex === index}
              className={`h-1.5 rounded-full transition-all ${
                candidateIndex === index
                  ? `w-4 ${isMatichoc ? "bg-sponsor-accent" : "bg-accent"}`
                  : `w-1.5 ${isMatichoc ? "bg-sponsor-accent/30" : "bg-accent-soft"}`
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
