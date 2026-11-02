import { getTranslations, setRequestLocale } from "next-intl/server";
import { resolveLocale } from "@/i18n/utils";
import { Link } from "@/i18n/navigation";
import { PageHero } from "@/components/ui/page-hero";
import { EmptyState } from "@/components/ui/empty-state";
import { ListenButton } from "@/components/ui/listen-button";
import { ShareButton } from "@/components/place/share-button";
import { RouteNavigationMap } from "@/components/map/route-navigation-map";
import { AddRouteToTripButton } from "@/components/trip/add-route-to-trip-button";
import { getPlacesBySlugs } from "@/lib/data/places";
import { parseSharedStops, SHARE_PARAM } from "@/lib/trip/share-link";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "sharedTrip" });
  return buildPageMetadata({
    locale,
    href: "/recorrido/compartido",
    title: t("title"),
    description: t("metaDescription"),
    // Cada link es el recorrido de una persona: nada que indexar.
    noIndex: true,
  });
}

/**
 * Recorrido que alguien compartió por link (`?paradas=a,b,c`, ver
 * `lib/trip/share-link.ts`). Pedido del usuario (2026-11-01): que los
 * recorridos que se arman "se compartan con otra persona, y esa otra persona
 * pueda ver la ruta que le están compartiendo". Se ve en el mapa, se navega
 * con la guía paso a paso, se escucha, y se puede guardar en Mi recorrido o
 * volver a compartir. Las paradas que no existen o quedan fuera del sitio se
 * omiten sin romper el resto.
 */
export default async function SharedTripPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations("sharedTrip");
  const tListen = await getTranslations("listen");

  const slugs = parseSharedStops((await searchParams)[SHARE_PARAM]);
  const places = await getPlacesBySlugs(slugs, locale);

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-8">
      <PageHero
        title={t("title")}
        subtitle={
          places.length > 0
            ? t("subtitle", { count: places.length })
            : t("emptySubtitle")
        }
        scene="cerro"
      />

      {places.length === 0 ? (
        <EmptyState>
          <p>{t("empty")}</p>
          <Link href="/explorar" className="text-accent mt-2 inline-block">
            {t("explore")} →
          </Link>
        </EmptyState>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <ListenButton
              name={t("title")}
              segments={[
                tListen("stopsIntro", {
                  stops: places.map((place) => place.name).join(", "),
                }),
              ]}
            />
            <ShareButton title={t("title")} label={t("shareAgain")} />
          </div>

          <RouteNavigationMap
            className="h-[40vh] w-full overflow-hidden rounded-xl"
            markers={places.map((place) => ({
              slug: place.slug,
              name: place.name,
              shortDescription: place.shortDescription,
              latitude: place.latitude,
              longitude: place.longitude,
              categorySlug: place.categorySlug,
              icon: place.icon,
            }))}
          />

          <h2 className="text-lg font-medium">{t("stopsTitle")}</h2>
          <ol className="flex flex-col gap-2">
            {places.map((place, index) => (
              <li
                key={place.slug}
                className="surface-glass flex items-center gap-3 rounded-2xl px-3 py-2 text-sm"
              >
                <span className="border-accent-soft text-accent flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-medium">
                  {index + 1}
                </span>
                <Link
                  href={{
                    pathname: "/lugares/[slug]",
                    params: { slug: place.slug },
                  }}
                  className="hover:text-accent flex-1"
                >
                  <span className="font-medium">{place.name}</span>
                  <span className="text-foreground/60 block text-xs">
                    {[place.localityName, place.categoryName]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </Link>
              </li>
            ))}
          </ol>

          <div className="flex flex-col gap-1 pt-2">
            <AddRouteToTripButton
              routeId="compartido"
              placeIds={places.map((place) => place.id)}
            />
            <p className="text-foreground/60 text-xs">{t("saveHint")}</p>
          </div>
        </>
      )}
    </main>
  );
}
