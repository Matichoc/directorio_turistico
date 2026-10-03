"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { Municipality, MunicipalityLink } from "@/types/domain";
import { contactLinkHref, contactLinkLabel } from "@/lib/ui/contact-link";
import { SparkleField } from "@/components/ui/sparkle-field";

const AUTO_ADVANCE_MS = 6000;

/**
 * Banner rotativo en el home con las 5 municipalidades de la provincia y
 * sus enlaces oficiales reales (`contact_links`, ver migración
 * `0013_contact_links.sql` y `scripts/seed.ts`) — pedido del usuario
 * ("un banner móvil que las vaya mostrando y pasando"). Auto-avanza cada
 * `AUTO_ADVANCE_MS`, se pausa al pasar el mouse, y siempre deja puntos
 * para saltar a mano (mismo espíritu que el carrusel de fotos de
 * `PlacePhotoHero`, pero con avance automático porque es un banner, no
 * una galería que el usuario recorre a su ritmo).
 *
 * Si una comuna todavía no tiene ningún link cargado, su slide muestra un
 * mensaje neutro en vez de inventar una red que no existe (docs/DESIGN.md,
 * "Nunca fabricar datos"). No hay "evento destacado" todavía — queda para
 * cuando el usuario confirme uno real (ver docs/PLAN.md, sección 8.2).
 */
export function MunicipalityBanner({
  municipalities,
}: {
  municipalities: Municipality[];
}) {
  const t = useTranslations("home.municipality");
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const kindLabels: Record<string, string> = {
    website: t("linkKinds.website"),
    facebook: t("linkKinds.facebook"),
    instagram: t("linkKinds.instagram"),
    twitter: t("linkKinds.twitter"),
    phone: t("linkKinds.phone"),
    email: t("linkKinds.email"),
  };

  function labelFor(link: MunicipalityLink): string {
    return contactLinkLabel(link, kindLabels);
  }

  useEffect(() => {
    if (paused || municipalities.length <= 1) return;
    const id = setInterval(() => {
      setIndex((current) => (current + 1) % municipalities.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(id);
  }, [paused, municipalities.length]);

  if (municipalities.length === 0) return null;

  const current = municipalities[index];

  return (
    <section
      className="px-4"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <h2 className="mb-3 text-lg font-medium">{t("title")}</h2>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1b0e1f] via-[#2a1420] to-[#1b0e1f] p-4 text-white">
        <SparkleField />
        <div className="bg-accent animate-glow-pulse pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full opacity-40 blur-3xl" />
        <div className="relative">
          <p className="font-medium">{current.name}</p>
          {current.links.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {current.links.map((link) => (
                <a
                  key={`${link.kind}-${link.value}`}
                  href={contactLinkHref(link.kind, link.value)}
                  target={
                    link.kind === "phone" || link.kind === "email"
                      ? undefined
                      : "_blank"
                  }
                  rel="noopener noreferrer"
                  className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs text-white/90 hover:border-white/60 hover:bg-white/20"
                >
                  {labelFor(link)}
                </a>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-sm text-white/60">{t("noLinksYet")}</p>
          )}

          {municipalities.length > 1 && (
            <div className="mt-3 flex items-center gap-1.5">
              {municipalities.map((municipality, municipalityIndex) => (
                <button
                  key={municipality.id}
                  type="button"
                  onClick={() => setIndex(municipalityIndex)}
                  aria-label={t("goTo", { name: municipality.name })}
                  aria-current={municipalityIndex === index}
                  className={`h-1.5 rounded-full transition-all ${
                    municipalityIndex === index
                      ? "bg-accent w-4"
                      : "w-1.5 bg-white/25"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
