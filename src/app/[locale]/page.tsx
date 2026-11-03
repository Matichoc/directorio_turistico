import { getTranslations, setRequestLocale } from "next-intl/server";
import { HomeSearchForm } from "@/components/home/home-search-form";
import { RouteCard } from "@/components/route/route-card";
import { MunicipalityBanner } from "@/components/home/municipality-banner";
import { CategoryIcon } from "@/components/ui/category-icon";
import { SparkleField } from "@/components/ui/sparkle-field";
import { AiArtLabel } from "@/components/ui/ai-art-label";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { resolveLocale } from "@/i18n/utils";
import { listRoutes } from "@/lib/data/routes";
import { listCommunes, listMunicipalities } from "@/lib/data/communes";
import { listLocalities } from "@/lib/data/localities";
import { listPlaces } from "@/lib/data/places";
import { buildProvinceFlyover } from "@/lib/ui/province-flyover";
import { ProvinceFlyover } from "@/components/home/province-flyover";
import { LegendCard } from "@/components/legend/legend-card";
import { EventsHighlight } from "@/components/events/events-highlight";
import { listEvents } from "@/lib/data/events";
import { todayInChile } from "@/lib/events/agenda";
import { ReportajesSection } from "@/components/video/reportajes-section";
import { REPORTAJES } from "@/lib/reportajes";
import { getCategoryGradient } from "@/lib/ui/category-gradient";
import {
  SCENE_POSITION,
  SCENE_SRC,
  getSceneForCategory,
} from "@/lib/ui/scene-backgrounds";
import type { Metadata } from "next";
import { buildPageMetadata, truncateDescription } from "@/lib/seo";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const INTENT_CATEGORIES = [
  { slug: "gastronomia", key: "gastronomy" as const, icon: "utensils" },
  { slug: "alojamiento", key: "lodging" as const, icon: "cama" },
  { slug: "naturaleza", key: "nature" as const, icon: "mountain" },
  { slug: "cultura", key: "culture" as const, icon: "landmark" },
  { slug: "recreacion", key: "leisure" as const, icon: "recreacion" },
  { slug: "playa", key: "beach" as const, icon: "waves" },
];

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "home" });
  return buildPageMetadata({
    locale,
    href: "/",
    title: t("title"),
    description: truncateDescription(t("subtitle")),
    absoluteTitle: true,
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const tVideos = await getTranslations("videos");

  const [
    t,
    tRoute,
    tExplore,
    routes,
    municipalities,
    communes,
    localities,
    places,
    events,
    tEvents,
  ] = await Promise.all([
    getTranslations("home"),
    getTranslations("route"),
    getTranslations("explore"),
    listRoutes(locale, 3),
    listMunicipalities(locale),
    listCommunes(locale),
    listLocalities(locale),
    listPlaces(locale),
    listEvents(locale),
    getTranslations("events"),
  ]);
  const flyover = buildProvinceFlyover(communes, localities, places);
  // Solo las categorías con lugares reales: en un sitio acotado a una comuna
  // (lib/site-scope.ts) una postal que lleva a una lista vacía confunde.
  const intents = INTENT_CATEGORIES.map((intent) => ({
    ...intent,
    count: places.filter((place) => place.categorySlugs.includes(intent.slug))
      .length,
  })).filter((intent) => intent.count > 0);

  return (
    <main className="flex flex-1 flex-col gap-8">
      <div className="to-background relative flex flex-col gap-6 overflow-hidden rounded-b-2xl border-b border-black/10 bg-gradient-to-b from-[#1b0e1f] via-[#2a1420] px-4 pt-8 pb-10 text-white dark:border-white/10">
        <div
          className="animate-glow-pulse bg-accent/50 pointer-events-none absolute -top-20 -right-16 h-64 w-64 rounded-full blur-3xl"
          aria-hidden="true"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-cover"
          style={{
            backgroundImage: `url(${SCENE_SRC.cerro})`,
            backgroundPosition: SCENE_POSITION.cerro,
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#07060c]/85 via-[#07060c]/45 via-60% to-transparent"
        />
        {/* En celular el título cae encima del diablito: un velo extra solo
            ahí, para que el texto se lea siempre. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[#07060c]/45 sm:hidden"
        />
        <SparkleField />
        <AiArtLabel className="right-3 bottom-3" />

        <p className="relative text-xs font-semibold tracking-wide text-amber-300 uppercase">
          {t("provinceLabel", { count: flyover.villages.length })}
        </p>

        {/* Desde sm: el texto ocupa la mitad izquierda; la derecha es del
            diablo de la escena (sin taparle la cara). */}
        <h1 className="font-display relative text-3xl leading-tight font-semibold tracking-wide text-balance [text-shadow:0_2px_18px_rgba(7,6,12,0.85)] sm:max-w-[62%] sm:text-4xl">
          {t("title")}
        </h1>
        <p className="relative max-w-prose text-white/70 sm:max-w-[62%]">
          {t("subtitle")}
        </p>

        <div className="relative sm:max-w-[62%]">
          <HomeSearchForm />
        </div>
      </div>

      <ProvinceFlyover data={flyover} />

      {/* La leyenda que le da nombre al sitio (página /leyenda). */}
      <section className="reveal px-4">
        <LegendCard />
      </section>

      {/* El reportaje destacado (Canal 13); los demás, en la leyenda. */}
      <div className="px-4">
        <ReportajesSection
          title={tVideos("title")}
          items={REPORTAJES.slice(0, 1)}
          footer={
            <Link
              href={{ pathname: "/leyenda", hash: "reportajes" }}
              className="text-accent w-fit text-sm font-semibold"
            >
              {tVideos("more", { count: REPORTAJES.length })} →
            </Link>
          }
        />
      </div>

      {/* Qué pasa en Petorca: lo próximo y las fiestas de cada año que vienen. */}
      <div className="px-4">
        <EventsHighlight
          events={events}
          locale={locale}
          today={todayInChile()}
          title={tEvents("title")}
        />
      </div>

      <section className="reveal px-4">
        <h2 className="mb-3 text-lg font-medium">{t("intent.title")}</h2>
        {/* Postales por categoría: cada una con la escena del diablito que le
            corresponde (playa, cerro, pueblo, dulces — ver
            lib/ui/scene-backgrounds.ts) y cuántos lugares reales tiene. */}
        <ul
          className={`grid grid-cols-2 gap-3 ${intents.length > 2 ? "sm:grid-cols-4" : ""}`}
        >
          {intents.map((intent) => {
            const { count } = intent;
            return (
              <li key={intent.slug}>
                <Link
                  href={{
                    pathname: "/explorar",
                    query: { categoria: intent.slug },
                  }}
                  className="group hover:border-accent relative flex h-40 flex-col justify-end overflow-hidden rounded-2xl border border-white/10 p-3 text-white shadow-[0_8px_30px_-12px_rgba(0,0,0,0.8)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_28px_2px_var(--accent-soft)] sm:h-48"
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 bg-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    style={{
                      backgroundImage: `url(${SCENE_SRC[getSceneForCategory(intent.slug)]})`,
                      backgroundPosition:
                        SCENE_POSITION[getSceneForCategory(intent.slug)],
                    }}
                  />
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-[#07060c] via-[#07060c]/55 to-transparent"
                  />
                  <span
                    aria-hidden="true"
                    className={`absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-gradient-to-br opacity-50 blur-2xl transition-opacity duration-300 group-hover:opacity-80 ${getCategoryGradient(intent.slug)}`}
                  />
                  {/* Arriba a la izquierda: abajo va la categoría y a la
                      derecha está la cara del diablo. */}
                  <AiArtLabel className="top-2 left-2" />
                  <span className="relative flex items-center gap-2">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br shadow-lg ring-1 ring-white/30 ${getCategoryGradient(intent.slug)}`}
                    >
                      <CategoryIcon
                        icon={intent.icon}
                        className="h-4.5 w-4.5"
                      />
                    </span>
                    <span className="flex flex-col leading-tight">
                      <span className="text-base font-semibold [text-shadow:0_1px_8px_rgba(0,0,0,0.8)]">
                        {t(`intent.${intent.key}`)}
                      </span>
                      {count > 0 && (
                        <span className="text-xs text-white/75">
                          {tExplore("resultsCount", { count })}
                        </span>
                      )}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <MunicipalityBanner municipalities={municipalities} />

      <section className="reveal px-4 pb-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">{t("featuredRoutes")}</h2>
          <Link href="/rutas" className="text-accent text-sm underline">
            {tRoute("viewAll")} →
          </Link>
        </div>
        {routes.length > 0 && (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {routes.map((route) => (
              <li key={route.id} className="reveal">
                <RouteCard route={route} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
