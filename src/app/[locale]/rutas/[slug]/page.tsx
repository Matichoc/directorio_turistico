import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getRouteBySlug } from "@/lib/data/routes";
import { resolveLocale } from "@/i18n/utils";
import { RouteNavigationMap } from "@/components/map/route-navigation-map";
import { AddRouteToTripButton } from "@/components/trip/add-route-to-trip-button";
import { RouteStopChecklist } from "@/components/route/route-stop-checklist";

export default async function RouteDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations("route");

  const route = await getRouteBySlug(slug, locale);
  if (!route) {
    notFound();
  }

  const hours = route.estimatedDurationMinutes
    ? Math.round((route.estimatedDurationMinutes / 60) * 10) / 10
    : null;

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{route.name}</h1>
        {hours && (
          <p className="text-foreground/60 text-sm">
            {t("duration")}: {hours}h
          </p>
        )}
      </header>

      {route.description && (
        <p className="text-foreground/70">{route.description}</p>
      )}

      {route.stops.length > 0 && (
        <RouteNavigationMap
          className="h-[35vh] w-full overflow-hidden rounded-xl"
          markers={route.stops.map((stop) => ({
            slug: stop.placeSlug,
            name: stop.placeName,
            latitude: stop.latitude,
            longitude: stop.longitude,
          }))}
        />
      )}

      <RouteStopChecklist routeId={route.id} stops={route.stops} />

      {route.stops.length > 0 && (
        <div className="pt-2">
          <AddRouteToTripButton
            routeId={route.id}
            placeIds={route.stops.map((stop) => stop.placeId)}
          />
        </div>
      )}
    </main>
  );
}
