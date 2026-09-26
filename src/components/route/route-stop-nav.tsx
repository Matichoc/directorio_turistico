import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getRouteBySlug } from "@/lib/data/routes";
import { CategoryIcon } from "@/components/ui/category-icon";
import { getCategoryPinColor, getPlaceIcon } from "@/lib/ui/category-gradient";
import type { Locale } from "@/types/domain";

/**
 * Barra "parada anterior / siguiente" en la ficha de un lugar, cuando se
 * llega a ella desde una ruta (`?ruta=<slug>`, ver RouteStopChecklist).
 * Pedido del usuario: en una ruta no se puede "pasar rápido" de una parada
 * a otra, y como web app de celular casi nadie usa el botón atrás del
 * navegador — esto evita depender de él.
 *
 * La insignia circular de la izquierda usa el color/ícono de categoría de
 * la parada actual (mismo `getCategoryPinColor`/`getPlaceIcon` que
 * `MapPin`/`CategoryBadge`) — pedido explícito del usuario de que la barra
 * tuviera "algo alusivo a la zona que se recorre" en vez de ser un pill
 * genérico; los botones anterior/siguiente pasan de flechas sueltas a
 * círculos con borde y glow en hover, mismo patrón que `PlaceCard`.
 *
 * Server component: solo son links, no necesita estado en el cliente.
 */
export async function RouteStopNav({
  routeSlug,
  placeSlug,
  locale,
}: {
  routeSlug: string;
  placeSlug: string;
  locale: Locale;
}) {
  const route = await getRouteBySlug(routeSlug, locale);
  if (!route) return null;

  const stops = route.stops;
  const currentIndex = stops.findIndex((stop) => stop.placeSlug === placeSlug);
  if (currentIndex === -1) return null;

  const t = await getTranslations("route");
  const current = stops[currentIndex];
  const previousStop = stops[currentIndex - 1];
  const nextStop = stops[currentIndex + 1];
  const color = getCategoryPinColor(current.categorySlug);

  const arrowClassName =
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent-soft text-accent text-lg transition-colors hover:border-accent hover:shadow-[0_0_12px_1px_var(--accent-soft)] dark:border-white/15";

  return (
    <div className="border-accent-soft bg-accent-soft/20 flex items-center gap-2 rounded-full border py-1.5 pr-2 pl-1.5 text-sm dark:border-white/10">
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white shadow-sm"
        style={{ backgroundColor: color }}
      >
        <CategoryIcon
          icon={getPlaceIcon(current.categorySlug, current.placeIcon)}
          className="h-4 w-4"
        />
      </span>

      {previousStop ? (
        <Link
          href={{
            pathname: "/lugares/[slug]",
            params: { slug: previousStop.placeSlug },
            query: { ruta: routeSlug },
          }}
          aria-label={t("previousStop")}
          className={arrowClassName}
        >
          ‹
        </Link>
      ) : (
        <span className="h-8 w-8 shrink-0" />
      )}

      <Link
        href={{ pathname: "/rutas/[slug]", params: { slug: routeSlug } }}
        className="text-foreground/70 min-w-0 flex-1 truncate text-center text-xs hover:underline"
      >
        {t("stopPosition", { current: currentIndex + 1, total: stops.length })}{" "}
        · {route.name}
      </Link>

      {nextStop ? (
        <Link
          href={{
            pathname: "/lugares/[slug]",
            params: { slug: nextStop.placeSlug },
            query: { ruta: routeSlug },
          }}
          aria-label={t("nextStop")}
          className={arrowClassName}
        >
          ›
        </Link>
      ) : (
        <span className="h-8 w-8 shrink-0" />
      )}
    </div>
  );
}
