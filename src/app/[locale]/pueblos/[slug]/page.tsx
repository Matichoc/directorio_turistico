import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { resolveLocale } from "@/i18n/utils";
import { Link } from "@/i18n/navigation";
import { PageHero } from "@/components/ui/page-hero";
import { PlaceCard } from "@/components/place/place-card";
import { MapView } from "@/components/map/map-view";
import { getLocalityBySlug } from "@/lib/data/localities";
import { getSceneForCategory } from "@/lib/ui/scene-backgrounds";
import type { Metadata } from "next";
import { buildPageMetadata, truncateDescription } from "@/lib/seo";
import { TrackEvent } from "@/components/analytics/track-event";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale: rawLocale, slug } = await params;
  const locale = resolveLocale(rawLocale);
  const locality = await getLocalityBySlug(slug, locale);
  if (!locality) return {};
  return buildPageMetadata({
    locale,
    href: { pathname: "/pueblos/[slug]", params: { slug } },
    title: `${locality.name} — ${locality.communeName}`,
    description: truncateDescription(locality.summary),
    image: locality.places.find((place) => place.photoUrl)?.photoUrl,
  });
}

export default async function LocalityDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations("locality");

  const locality = await getLocalityBySlug(slug, locale);
  if (!locality) {
    notFound();
  }

  // La coordenada del pueblo en sí es opcional (ver migración
  // 0021_locality_translations.sql: no se confirmó la de todos) — el pin
  // propio solo se agrega si se conoce; el mapa igual sirve con los pines
  // de sus lugares, que sí siempre tienen coordenada real.
  // La escena sigue a la categoría que más se repite entre sus atractivos
  // (Los Molles → playa, Alicahue → cerro…); sin atractivos, el pueblo genérico.
  const categoryCounts = new Map<string, number>();
  for (const place of locality.places) {
    categoryCounts.set(
      place.categorySlug,
      (categoryCounts.get(place.categorySlug) ?? 0) + 1,
    );
  }
  const topCategory = [...categoryCounts.entries()].sort(
    (a, b) => b[1] - a[1],
  )[0]?.[0];
  const scene = topCategory ? getSceneForCategory(topCategory) : "pueblo";

  const markers = [
    ...(locality.latitude !== null && locality.longitude !== null
      ? [
          {
            slug: locality.slug,
            name: locality.name,
            latitude: locality.latitude,
            longitude: locality.longitude,
            kind: "locality" as const,
          },
        ]
      : []),
    ...locality.places.map((place) => ({
      slug: place.slug,
      name: place.name,
      latitude: place.latitude,
      longitude: place.longitude,
      categorySlug: place.categorySlug,
      icon: place.icon,
    })),
  ];

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-8">
      <TrackEvent event={{ name: "locality_view", properties: { slug } }} />
      <Link
        href="/explorar"
        className="text-foreground/60 hover:text-accent w-fit text-sm underline-offset-2 hover:underline"
      >
        ← {t("backToList")}
      </Link>
      <PageHero
        title={locality.name}
        subtitle={locality.communeName}
        scene={scene}
      />

      {locality.summary && (
        <section className="surface-glass flex flex-col gap-2 rounded-2xl p-4">
          <h2 className="text-lg font-medium">
            {t("aboutTitle", { name: locality.name })}
          </h2>
          <p className="text-foreground/80 text-sm leading-relaxed">
            {locality.summary}
          </p>
          {locality.summarySourceUrl && (
            <p className="text-foreground/50 text-xs">
              {t("source")}:{" "}
              <a
                href={locality.summarySourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent underline underline-offset-2"
              >
                {locality.summarySourceLabel ?? locality.summarySourceUrl}
              </a>
            </p>
          )}
        </section>
      )}

      {markers.length > 0 && (
        <MapView
          className="h-[35vh] w-full overflow-hidden rounded-xl"
          markers={markers}
        />
      )}

      <h2 className="text-lg font-medium">
        {t("placesTitle", { name: locality.name })}
      </h2>
      {locality.places.length === 0 ? (
        <p className="text-foreground/60 text-sm">{t("noPlacesYet")}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {locality.places.map((place) => (
            <li key={place.id}>
              <PlaceCard place={place} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
