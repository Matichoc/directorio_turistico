import { getTranslations, setRequestLocale } from "next-intl/server";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { HomeSearchForm } from "@/components/home/home-search-form";
import { RouteCard } from "@/components/route/route-card";
import { MunicipalityBanner } from "@/components/home/municipality-banner";
import { CategoryIcon } from "@/components/ui/category-icon";
import { SparkleField } from "@/components/ui/sparkle-field";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { resolveLocale } from "@/i18n/utils";
import { listRoutes } from "@/lib/data/routes";
import { listCommunes, listMunicipalities } from "@/lib/data/communes";
import { listLocalities } from "@/lib/data/localities";
import { listPlaces } from "@/lib/data/places";
import { buildProvinceFlyover } from "@/lib/ui/province-flyover";
import { ProvinceFlyover } from "@/components/home/province-flyover";
import { getCategoryGradient } from "@/lib/ui/category-gradient";
import { SCENE_SRC, getSceneForCategory } from "@/lib/ui/scene-backgrounds";
import type { Metadata } from "next";
import { buildPageMetadata, truncateDescription } from "@/lib/seo";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const INTENT_CATEGORIES = [
  { slug: "naturaleza", key: "nature" as const, icon: "mountain" },
  { slug: "gastronomia", key: "gastronomy" as const, icon: "utensils" },
  { slug: "cultura", key: "culture" as const, icon: "landmark" },
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

  const [
    t,
    tRoute,
    tExplore,
    routes,
    municipalities,
    communes,
    localities,
    places,
  ] = await Promise.all([
    getTranslations("home"),
    getTranslations("route"),
    getTranslations("explore"),
    listRoutes(locale, 3),
    listMunicipalities(locale),
    listCommunes(locale),
    listLocalities(locale),
    listPlaces(locale),
  ]);
  const flyover = buildProvinceFlyover(communes, localities, places);

  return (
    <main className="flex flex-1 flex-col gap-8">
      <div className="to-background relative flex flex-col gap-6 overflow-hidden rounded-b-2xl border-b border-black/10 bg-gradient-to-b from-[#1b0e1f] via-[#2a1420] px-4 pt-8 pb-10 text-white dark:border-white/10">
        <div
          className="animate-glow-pulse bg-accent/50 pointer-events-none absolute -top-20 -right-16 h-64 w-64 rounded-full blur-3xl"
          aria-hidden="true"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-cover [background-position:85%_70%]"
          style={{ backgroundImage: `url(${SCENE_SRC.atardecer})` }}
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

        <header className="relative flex items-start justify-between gap-4">
          <p className="text-xs font-semibold tracking-wide text-amber-300 uppercase">
            {t("provinceLabel")}
          </p>
          <LocaleSwitcher />
        </header>

        <h1 className="font-display relative text-3xl leading-tight font-semibold tracking-wide text-balance [text-shadow:0_2px_18px_rgba(7,6,12,0.85)] sm:text-4xl">
          {t("title")}
        </h1>
        <p className="relative max-w-prose text-white/70">{t("subtitle")}</p>

        <HomeSearchForm />
      </div>

      <ProvinceFlyover data={flyover} />

      <section className="reveal px-4">
        <h2 className="mb-3 text-lg font-medium">{t("intent.title")}</h2>
        {/* Postales por categoría: cada una con la escena del diablito que le
            corresponde (playa, cerro, pueblo, dulces — ver
            lib/ui/scene-backgrounds.ts) y cuántos lugares reales tiene. */}
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {INTENT_CATEGORIES.map((intent) => {
            const count = places.filter(
              (place) => place.categorySlug === intent.slug,
            ).length;
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
                    className="absolute inset-0 bg-cover [background-position:78%_75%] transition-transform duration-700 ease-out group-hover:scale-110"
                    style={{
                      backgroundImage: `url(${SCENE_SRC[getSceneForCategory(intent.slug)]})`,
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
