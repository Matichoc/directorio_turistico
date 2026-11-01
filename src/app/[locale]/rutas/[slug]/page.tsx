import { notFound } from "next/navigation";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getRouteBySlug } from "@/lib/data/routes";
import { resolveLocale } from "@/i18n/utils";
import { AddRouteToTripButton } from "@/components/trip/add-route-to-trip-button";
import { RouteMapWithStops } from "@/components/route/route-map-with-stops";
import { OfficialRouteCard } from "@/components/route/official-route-card";
import { DevilMascot } from "@/components/ui/devil-mascot";
import { ListenButton } from "@/components/ui/listen-button";
import { OfflineSaveButton } from "@/components/offline/offline-save-button";
import type { Metadata } from "next";
import {
  buildPageMetadata,
  localizedPath,
  truncateDescription,
} from "@/lib/seo";
import { TrackEvent } from "@/components/analytics/track-event";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = resolveLocale(rawLocale);
  const route = await getRouteBySlug(slug, locale);
  if (!route) return {};
  return buildPageMetadata({
    locale,
    href: { pathname: "/rutas/[slug]", params: { slug } },
    title: route.name,
    description: truncateDescription(route.description),
    image: route.coverImageUrl ?? route.stops[0]?.placePhotoUrl,
  });
}

export default async function RouteDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations("route");
  const tListen = await getTranslations("listen");

  const route = await getRouteBySlug(slug, locale);
  if (!route) {
    notFound();
  }

  const hours = route.estimatedDurationMinutes
    ? Math.round((route.estimatedDurationMinutes / 60) * 10) / 10
    : null;

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-8">
      <TrackEvent event={{ name: "route_view", properties: { slug } }} />
      {route.coverImageUrl && (
        <div className="relative h-48 w-full overflow-hidden rounded-xl sm:h-64">
          <Image
            src={route.coverImageUrl}
            alt={route.name}
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        </div>
      )}

      <header className="relative flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{route.name}</h1>
        {hours && (
          <p className="text-foreground/60 text-sm">
            {t("duration")}: {hours}h
          </p>
        )}
        {route.slug === "ruta-del-diablo" && (
          <DevilMascot className="animate-devil-peek text-accent pointer-events-none absolute top-0 right-0 h-10 w-10 opacity-70" />
        )}
        <ListenButton
          name={route.name}
          segments={[
            `${route.name}.`,
            route.description,
            route.stops.length > 0
              ? tListen("stopsIntro", {
                  stops: route.stops.map((stop) => stop.placeName).join(", "),
                })
              : null,
          ]}
        />
      </header>

      {route.description && (
        <p className="text-foreground/70">{route.description}</p>
      )}

      <OfficialRouteCard routeSlug={route.slug} />

      <RouteMapWithStops
        routeId={route.id}
        routeSlug={route.slug}
        stops={route.stops}
        mapClassName="h-[35vh] w-full overflow-hidden rounded-xl"
      />

      {route.stops.length > 0 && (
        <div className="flex flex-col gap-4 pt-2">
          <AddRouteToTripButton
            routeId={route.id}
            placeIds={route.stops.map((stop) => stop.placeId)}
          />
          {/* Para el valle sin señal: la ruta, sus paradas y el mapa. */}
          <OfflineSaveButton
            saveKey={`ruta:${route.slug}`}
            title={route.name}
            pages={[
              localizedPath(
                { pathname: "/rutas/[slug]", params: { slug: route.slug } },
                locale,
              ),
              ...route.stops.map((stop) =>
                localizedPath(
                  {
                    pathname: "/lugares/[slug]",
                    params: { slug: stop.placeSlug },
                  },
                  locale,
                ),
              ),
            ]}
            points={route.stops.map((stop) => ({
              latitude: stop.latitude,
              longitude: stop.longitude,
            }))}
          />
        </div>
      )}
    </main>
  );
}
