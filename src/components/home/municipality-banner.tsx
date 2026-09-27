"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { Municipality, MunicipalityLink } from "@/types/domain";
import { contactLinkHref, contactLinkLabel } from "@/lib/ui/contact-link";

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
      <div className="border-accent-soft rounded-2xl border p-4 dark:border-white/10">
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
                className="border-accent-soft text-foreground/70 hover:border-accent rounded-full border px-3 py-1 text-xs dark:border-white/15"
              >
                {labelFor(link)}
              </a>
            ))}
          </div>
        ) : (
          <p className="text-foreground/50 mt-1 text-sm">{t("noLinksYet")}</p>
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
                    : "bg-accent-soft w-1.5"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
