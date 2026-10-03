import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { resolveLocale } from "@/i18n/utils";
import { listPlaces } from "@/lib/data/places";
import { listCommunes } from "@/lib/data/communes";
import { listLocalities } from "@/lib/data/localities";
import { listCategories } from "@/lib/data/categories";
import { listTags } from "@/lib/data/tags";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHero } from "@/components/ui/page-hero";
import { ExploreFilters } from "@/components/explore/explore-filters";
import { FiltersDisclosure } from "@/components/explore/filters-disclosure";
import { LocalityBrowser } from "@/components/explore/locality-browser";
import { ViewToggle } from "@/components/explore/view-toggle";
import { MapView } from "@/components/map/map-view";
import { buildExploreTree } from "@/lib/ui/build-explore-tree";
import { getSceneForCategory } from "@/lib/ui/scene-backgrounds";

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

  const [places, communes, localities, categories, tags] = await Promise.all([
    listPlaces(locale, {
      query: filters.q,
      communeSlug: filters.comuna,
      categorySlug: filters.categoria,
      tagSlug: filters.caracteristica,
    }),
    listCommunes(locale),
    listLocalities(locale),
    listCategories(locale),
    listTags(),
  ]);

  const filtersActiveCount = [
    filters.q,
    filters.comuna,
    filters.categoria,
    filters.caracteristica,
  ].filter(Boolean).length;

  const tree = buildExploreTree(
    filters.comuna
      ? communes.filter((commune) => commune.slug === filters.comuna)
      : communes,
    localities,
    places,
  );

  // Pueblos con coordenada confirmada también van al mapa. Con un filtro de
  // búsqueda/categoría/característica solo los que tienen atractivos que
  // coinciden (si no, el mapa se llenaría de pueblos ajenos a la búsqueda).
  const narrowing = Boolean(
    filters.q || filters.categoria || filters.caracteristica,
  );
  const villageMarkers = tree.flatMap((commune) =>
    commune.localities.flatMap((village) =>
      village.slug &&
      village.name &&
      village.latitude !== null &&
      village.longitude !== null &&
      (!narrowing || village.places.length > 0)
        ? [
            {
              slug: village.slug,
              name: village.name,
              latitude: village.latitude,
              longitude: village.longitude,
              kind: "locality" as const,
            },
          ]
        : [],
    ),
  );

  const mapMarkers = [
    ...villageMarkers,
    ...places.map((place) => ({
      slug: place.slug,
      name: place.name,
      shortDescription: place.shortDescription,
      latitude: place.latitude,
      longitude: place.longitude,
      categorySlug: place.categorySlug,
      icon: place.icon,
    })),
  ];

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-8">
      <PageHero
        title={t("title")}
        subtitle={t("subtitle")}
        scene={getSceneForCategory(filters.categoria)}
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <FiltersDisclosure activeCount={filtersActiveCount}>
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
        </FiltersDisclosure>
        <ViewToggle current={view} />
      </div>

      {view === "mapa" ? (
        <>
          <p className="text-foreground/50 text-sm">
            {t("resultsCount", { count: places.length })}
            {villageMarkers.length > 0 &&
              ` · ${t("villagesOnMap", { count: villageMarkers.length })}`}
          </p>
          {mapMarkers.length === 0 ? (
            <EmptyState>{t("noResults")}</EmptyState>
          ) : (
            <MapView
              className="h-[60vh] w-full overflow-hidden rounded-xl"
              markers={mapMarkers}
            />
          )}
        </>
      ) : tree.length === 0 ? (
        <EmptyState>{t("noResults")}</EmptyState>
      ) : (
        <LocalityBrowser
          key={`${filters.q}|${filters.comuna}|${filters.categoria}|${filters.caracteristica}`}
          tree={tree}
          filtersActive={filtersActiveCount > 0}
        />
      )}
    </main>
  );
}
