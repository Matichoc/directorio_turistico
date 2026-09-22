import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPlaceBySlug } from "@/lib/data/places";
import { resolveLocale } from "@/i18n/utils";
import { ShareButton } from "@/components/place/share-button";
import { AddToTripButton } from "@/components/trip/add-to-trip-button";
import { MapView } from "@/components/map/map-view";
import { PlacePhotoHero } from "@/components/place/place-photo-hero";

export default async function PlaceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations("place");

  const place = await getPlaceBySlug(slug, locale);
  if (!place) {
    notFound();
  }

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{place.name}</h1>
        <p className="text-foreground/60 text-sm">
          {place.communeName}
          {place.categoryName ? ` · ${place.categoryName}` : ""}
        </p>
        {place.verificationStatus === "verified" ? (
          <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
            {t("verified")}
          </span>
        ) : (
          <span className="w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            {t("verificationPending")}
          </span>
        )}
      </header>

      <PlacePhotoHero
        categorySlug={place.categorySlug}
        name={place.name}
        photoUrl={place.photoUrl}
        photoAttribution={place.photoAttribution}
      />

      <MapView
        className="h-[35vh] w-full overflow-hidden rounded-xl"
        markers={[
          {
            slug: place.slug,
            name: place.name,
            latitude: place.latitude,
            longitude: place.longitude,
            categorySlug: place.categorySlug,
          },
        ]}
      />

      {place.description && (
        <p className="text-foreground/70">{place.description}</p>
      )}

      <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        {place.address && (
          <div>
            <dt className="text-foreground/50">{t("address")}</dt>
            <dd>{place.address}</dd>
          </div>
        )}
        {place.phone && (
          <div>
            <dt className="text-foreground/50">{t("phone")}</dt>
            <dd>
              <a href={`tel:${place.phone}`} className="underline">
                {place.phone}
              </a>
            </dd>
          </div>
        )}
        {place.website && (
          <div>
            <dt className="text-foreground/50">{t("website")}</dt>
            <dd>
              <a
                href={place.website}
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {place.website}
              </a>
            </dd>
          </div>
        )}
      </dl>

      {place.tags.length > 0 && (
        <div>
          <h2 className="text-foreground/50 mb-1 text-sm">{t("tags")}</h2>
          <ul className="flex flex-wrap gap-2">
            {place.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-black/10 px-3 py-1 text-xs dark:border-white/20"
              >
                {tag}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-2">
        <AddToTripButton placeId={place.id} />
        <ShareButton title={place.name} />
      </div>
    </main>
  );
}
