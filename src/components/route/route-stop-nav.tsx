import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getRouteBySlug } from "@/lib/data/routes";
import type { Locale } from "@/types/domain";

/**
 * Barra "parada anterior / siguiente" en la ficha de un lugar, cuando se
 * llega a ella desde una ruta (`?ruta=<slug>`, ver RouteStopChecklist).
 * Pedido del usuario: en una ruta no se puede "pasar rápido" de una parada
 * a otra, y como web app de celular casi nadie usa el botón atrás del
 * navegador — esto evita depender de él.
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
  const previousStop = stops[currentIndex - 1];
  const nextStop = stops[currentIndex + 1];

  return (
    <div className="border-accent-soft bg-accent-soft/20 flex items-center justify-between gap-2 rounded-full border px-2 py-1.5 text-sm dark:border-white/10">
      {previousStop ? (
        <Link
          href={{
            pathname: "/lugares/[slug]",
            params: { slug: previousStop.placeSlug },
            query: { ruta: routeSlug },
          }}
          aria-label={t("previousStop")}
          className="text-accent flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg hover:bg-black/5 dark:hover:bg-white/10"
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
          className="text-accent flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg hover:bg-black/5 dark:hover:bg-white/10"
        >
          ›
        </Link>
      ) : (
        <span className="h-8 w-8 shrink-0" />
      )}
    </div>
  );
}
