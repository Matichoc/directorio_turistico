"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
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
}

/**
 * Lista de paradas con checklist marcable (solo localStorage, ver
 * lib/route-progress/storage.ts): barra de progreso, halo pulsante en la
 * próxima parada por visitar, y mensaje de felicitación al completar la
 * ruta. Pedido del usuario para que las rutas se sientan más "dinámicas".
 */
export function RouteStopChecklist({
  routeId,
  stops,
}: {
  routeId: string;
  stops: RouteStop[];
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

          return (
            <li
              key={stop.id}
              className={`animate-stop-in flex items-center gap-3 rounded-lg border px-3 py-2 text-sm transition-colors ${
                isVisited
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
                }}
                className={`flex-1 hover:underline ${
                  isVisited ? "text-foreground/50 line-through" : ""
                }`}
              >
                {stop.placeName}
              </Link>
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
