"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PhotoOrIcon } from "@/components/place/photo-or-icon";
import { getCategoryGradient } from "@/lib/ui/category-gradient";
import {
  getVisitedPlaceIds,
  ROUTE_PROGRESS_EVENT,
  toggleVisited,
} from "@/lib/route-progress/storage";

interface RouteStop {
  id: string;
  placeId: string;
  placeSlug: string;
  placeName: string;
  placeShortDescription?: string | null;
  placePhotoUrl?: string | null;
  categorySlug?: string | null;
  placeIcon?: string | null;
  notes?: string | null;
}

/**
 * Lista de paradas con checklist marcable (solo localStorage, ver
 * lib/route-progress/storage.ts): barra de progreso, halo pulsante en la
 * próxima parada por visitar, y mensaje de felicitación al completar la
 * ruta. Pedido del usuario para que las rutas se sientan más "dinámicas".
 *
 * Cada parada lleva una miniatura + descripción breve (pedido del usuario:
 * "las paradas podrían tener una breve descripción y alguna imagen alusiva
 * en ese banner"). El link a la ficha del lugar lleva `?ruta=<routeId>`
 * para que esa página pueda ofrecer "parada anterior/siguiente" en vez de
 * depender del botón atrás del navegador (poco usado en una web app de
 * celular, feedback explícito del usuario).
 */
export function RouteStopChecklist({
  routeId,
  routeSlug,
  stops,
  highlightedSlug = null,
  onHoverStop,
}: {
  routeId: string;
  routeSlug: string;
  stops: RouteStop[];
  /** Resaltado cruzado mapa↔lista (ver route-map-with-stops.tsx). */
  highlightedSlug?: string | null;
  onHoverStop?: (slug: string | null) => void;
}) {
  const t = useTranslations("route");
  const [visited, setVisited] = useState<Set<string>>(new Set());

  useEffect(() => {
    function sync() {
      setVisited(new Set(getVisitedPlaceIds(routeId)));
    }
    sync();
    window.addEventListener(ROUTE_PROGRESS_EVENT, sync);
    return () => window.removeEventListener(ROUTE_PROGRESS_EVENT, sync);
  }, [routeId]);

  const visitedCount = stops.filter((stop) => visited.has(stop.placeId)).length;
  const nextStopId = stops.find((stop) => !visited.has(stop.placeId))?.placeId;
  const allVisited = stops.length > 0 && visitedCount === stops.length;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-foreground/50 text-sm font-medium">
          {t("stops")} ({stops.length})
        </h2>
        {stops.length > 0 && (
          <span className="text-foreground/50 text-xs">
            {t("checklistProgress", {
              visited: visitedCount,
              total: stops.length,
            })}
          </span>
        )}
      </div>

      {stops.length > 0 && (
        <div className="bg-accent-soft mb-3 h-1.5 w-full overflow-hidden rounded-full">
          <div
            className="bg-accent h-full rounded-full transition-all duration-500"
            style={{ width: `${(visitedCount / stops.length) * 100}%` }}
          />
        </div>
      )}

      <ol className="flex flex-col gap-2">
        {stops.map((stop, index) => {
          const isVisited = visited.has(stop.placeId);
          const isNext = stop.placeId === nextStopId;
          const isHighlighted = highlightedSlug === stop.placeSlug;

          return (
            <li
              key={stop.id}
              onMouseEnter={() => onHoverStop?.(stop.placeSlug)}
              onMouseLeave={() => onHoverStop?.(null)}
              className={`animate-stop-in flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${
                isHighlighted
                  ? "border-accent bg-accent-soft/40"
                  : isVisited
                    ? "border-accent-soft bg-accent-soft/40"
                    : "border-black/10 dark:border-white/10"
              } ${isNext ? "animate-route-glow" : ""}`}
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <button
                type="button"
                onClick={() => toggleVisited(routeId, stop.placeId)}
                aria-label={isVisited ? t("markNotVisited") : t("markVisited")}
                aria-pressed={isVisited}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-medium transition-colors ${
                  isVisited
                    ? "border-accent bg-accent text-accent-foreground animate-check-pop"
                    : "border-foreground/30 text-foreground/50"
                }`}
              >
                {isVisited ? "✓" : index + 1}
              </button>
              <Link
                href={{
                  pathname: "/lugares/[slug]",
                  params: { slug: stop.placeSlug },
                  query: { ruta: routeSlug },
                }}
                className={`relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br ${getCategoryGradient(stop.categorySlug)}`}
              >
                <PhotoOrIcon
                  photoUrl={stop.placePhotoUrl}
                  alt={stop.placeName}
                  categorySlug={stop.categorySlug}
                  icon={stop.placeIcon}
                  iconClassName="h-5 w-5 text-white/70"
                  imgClassName="object-cover object-[center_65%]"
                  sizes="44px"
                />
              </Link>

              <div className="flex flex-1 flex-col">
                <Link
                  href={{
                    pathname: "/lugares/[slug]",
                    params: { slug: stop.placeSlug },
                    query: { ruta: routeSlug },
                  }}
                  className={`hover:underline ${
                    isVisited ? "text-foreground/50 line-through" : ""
                  }`}
                >
                  {stop.placeName}
                </Link>
                {stop.placeShortDescription && (
                  <span className="text-foreground/60 line-clamp-1 text-xs">
                    {stop.placeShortDescription}
                  </span>
                )}
                {stop.notes && (
                  <span className="text-foreground/50 text-xs italic">
                    {stop.notes}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {allVisited && (
        <p className="animate-check-pop border-accent-soft bg-accent-soft/40 text-accent mt-3 rounded-lg border px-3 py-2 text-center text-sm font-medium">
          {t("routeComplete")}
        </p>
      )}
    </div>
  );
}
