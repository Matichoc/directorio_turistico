import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { resolveLocale } from "@/i18n/utils";
import { listPlaces } from "@/lib/data/places";
import { listCommunes } from "@/lib/data/communes";
import { listCategories } from "@/lib/data/categories";
import { listTags } from "@/lib/data/tags";
import { PlaceCard } from "@/components/place/place-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ExploreFilters } from "@/components/explore/explore-filters";
import { ViewToggle } from "@/components/explore/view-toggle";
import { MapView } from "@/components/map/map-view";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

interface ExplorePageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    comuna?: string;
    categoria?: string;
    caracteristica?: string;
    vista?: string;
  }>;
}

export default async function ExplorePage({
  params,
  searchParams,
}: ExplorePageProps) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations("explore");

  const filters = await searchParams;
  const view = filters.vista === "mapa" ? "mapa" : "lista";

  const [places, communes, categories, tags] = await Promise.all([
    listPlaces(locale, {
      query: filters.q,
      communeSlug: filters.comuna,
      categorySlug: filters.categoria,
      tagSlug: filters.caracteristica,
    }),
    listCommunes(locale),
    listCategories(locale),
    listTags(),
  ]);

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-8">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <ViewToggle current={view} />
      </div>

      <ExploreFilters
        value={{
          q: filters.q ?? "",
          comuna: filters.comuna ?? "",
          categoria: filters.categoria ?? "",
          caracteristica: filters.caracteristica ?? "",
        }}
        communes={communes}
        categories={categories}
        tags={tags}
      />

      <p className="text-foreground/50 text-sm">
        {t("resultsCount", { count: places.length })}
      </p>

      {places.length === 0 ? (
        <EmptyState>{t("noResults")}</EmptyState>
      ) : view === "mapa" ? (
        <MapView
          className="h-[60vh] w-full overflow-hidden rounded-xl"
          markers={places.map((place) => ({
            slug: place.slug,
            name: place.name,
            latitude: place.latitude,
            longitude: place.longitude,
          }))}
        />
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {places.map((place) => (
            <li key={place.id}>
              <PlaceCard place={place} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
