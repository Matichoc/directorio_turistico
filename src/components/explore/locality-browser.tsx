"use client";

import { useState, type PointerEvent } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PlaceCard } from "@/components/place/place-card";
import type { ExploreCommuneNode } from "@/lib/ui/build-explore-tree";

interface LocalityBrowserProps {
  tree: ExploreCommuneNode[];
  /** Hay filtros activos: el vacío de un pueblo se explica por los filtros. */
  filtersActive: boolean;
}

/**
 * Árbol comuna → pueblo → atractivos (pedido del usuario: una sola pantalla
 * ordenada por comuna y pueblo; "al pasar por arriba de una se abra como los
 * atractivos que tiene y si quisiera navegarla, ya pueda hacer clic y quede
 * fija abierta"). Pasar el mouse previsualiza; clic (o toque en celular)
 * la fija abierta hasta volver a tocarla. El hover solo reacciona al mouse
 * (`pointerType === "mouse"`): en pantallas táctiles el toque dispara
 * eventos de mouse sintéticos que dejarían el pueblo "pegado" abierto sin
 * poder cerrarlo con un segundo toque.
 */
export function LocalityBrowser({ tree, filtersActive }: LocalityBrowserProps) {
  const t = useTranslations("explore");
  const tLocality = useTranslations("locality");
  const [pinned, setPinned] = useState<ReadonlySet<string>>(new Set());
  const [hovered, setHovered] = useState<string | null>(null);
  // Las comunas arrancan plegadas (son varias decenas de pueblos en total);
  // si hay filtros, arrancan abiertas para mostrar de entrada lo que coincide.
  const [openCommunes, setOpenCommunes] = useState<ReadonlySet<string>>(
    () => new Set(filtersActive ? tree.map((commune) => commune.slug) : []),
  );

  function toggleCommune(slug: string) {
    setOpenCommunes((current) => {
      const next = new Set(current);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  function togglePinned(key: string) {
    setPinned((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handlePointerEnter(event: PointerEvent, key: string) {
    if (event.pointerType === "mouse") setHovered(key);
  }

  function handlePointerLeave(event: PointerEvent, key: string) {
    if (event.pointerType === "mouse") {
      setHovered((current) => (current === key ? null : current));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {tree.map((commune) => {
        const communeOpen = openCommunes.has(commune.slug);
        const communePanelId = `commune-${commune.slug}`;
        const villageCount = commune.localities.filter(
          (locality) => locality.slug,
        ).length;
        const placeCount = commune.localities.reduce(
          (total, locality) => total + locality.places.length,
          0,
        );

        return (
          <section key={commune.slug} className="flex flex-col gap-2">
            <h2>
              <button
                type="button"
                aria-expanded={communeOpen}
                aria-controls={communePanelId}
                onClick={() => toggleCommune(commune.slug)}
                className="bg-foreground/5 hover:bg-foreground/10 flex w-full items-center gap-2 rounded-2xl px-4 py-3 text-left transition-colors"
              >
                <span
                  aria-hidden
                  className={`text-foreground/40 inline-block transition-transform ${
                    communeOpen ? "rotate-90" : ""
                  }`}
                >
                  ›
                </span>
                <span className="text-base font-semibold">{commune.name}</span>
                <span className="text-foreground/50 text-xs font-normal">
                  {t("communeSummary", {
                    villages: villageCount,
                    places: placeCount,
                  })}
                </span>
              </button>
            </h2>
            {communeOpen && (
              <ul id={communePanelId} className="flex flex-col gap-2">
                {commune.localities.map((locality) => {
                  const key = `${commune.slug}:${locality.slug ?? "otros"}`;
                  const isPinned = pinned.has(key);
                  const isOpen = isPinned || hovered === key;
                  const panelId = `locality-${key.replace(/[^\w-]/g, "-")}`;

                  return (
                    <li
                      key={key}
                      onPointerEnter={(event) => handlePointerEnter(event, key)}
                      onPointerLeave={(event) => handlePointerLeave(event, key)}
                      className={`rounded-2xl border transition-all ${
                        isPinned
                          ? "border-accent shadow-[0_0_20px_2px_var(--accent-soft)]"
                          : "border-accent-soft hover:border-accent dark:border-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-2 px-4 py-2">
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          aria-controls={panelId}
                          onClick={() => togglePinned(key)}
                          className="flex flex-1 items-center gap-2 text-left text-sm font-medium"
                        >
                          <span
                            aria-hidden
                            className={`text-foreground/40 inline-block transition-transform ${
                              isOpen ? "rotate-90" : ""
                            }`}
                          >
                            ›
                          </span>
                          <span
                            className={
                              locality.name ? "" : "text-foreground/60"
                            }
                          >
                            {locality.name ?? t("otherPlaces")}
                          </span>
                          <span className="text-foreground/40 text-xs font-normal">
                            {t("placesCount", {
                              count: locality.places.length,
                            })}
                          </span>
                          {isPinned && (
                            <span className="sr-only">{t("pinned")}</span>
                          )}
                        </button>
                        {locality.slug && (
                          <Link
                            href={{
                              pathname: "/pueblos/[slug]",
                              params: { slug: locality.slug },
                            }}
                            className="text-foreground/50 hover:text-accent text-xs underline-offset-2 hover:underline"
                          >
                            {t("viewVillage")}
                          </Link>
                        )}
                      </div>

                      {isOpen && (
                        <div id={panelId} className="px-4 pb-4">
                          {locality.places.length === 0 ? (
                            <p className="text-foreground/60 text-sm">
                              {filtersActive
                                ? t("noResults")
                                : tLocality("noPlacesYet")}
                            </p>
                          ) : (
                            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                              {locality.places.map((place) => (
                                <li key={place.id}>
                                  <PlaceCard place={place} />
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
