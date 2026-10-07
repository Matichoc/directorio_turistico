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
import { listMunicipalities } from "@/lib/data/communes";
import { getCategoryGradient } from "@/lib/ui/category-gradient";
import { SCENE_SRC } from "@/lib/ui/scene-backgrounds";
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

  const [t, routes, municipalities] = await Promise.all([
    getTranslations("home"),
    listRoutes(locale, 3),
    listMunicipalities(locale),
  ]);

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
        <SparkleField />

        <header className="relative flex items-start justify-between gap-4">
          <p className="text-xs font-semibold tracking-wide text-amber-300 uppercase">
            {t("provinceLabel")}
          </p>
          <LocaleSwitcher />
        </header>

        <h1 className="font-display relative text-3xl leading-tight font-semibold tracking-wide text-balance">
          {t("title")}
        </h1>
        <p className="relative max-w-prose text-white/70">{t("subtitle")}</p>

        <HomeSearchForm />
      </div>

      <section className="px-4">
        <h2 className="mb-3 text-lg font-medium">{t("intent.title")}</h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {INTENT_CATEGORIES.map((intent) => (
            <li key={intent.slug}>
              <Link
                href={{
                  pathname: "/explorar",
                  query: { categoria: intent.slug },
                }}
                className="border-accent-soft hover:border-accent surface-glass flex flex-col items-center gap-2 rounded-2xl border p-4 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-[0_0_20px_2px_var(--accent-soft)] dark:border-white/10"
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br text-white ${getCategoryGradient(intent.slug)}`}
                >
                  <CategoryIcon icon={intent.icon} className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium">
                  {t(`intent.${intent.key}`)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <MunicipalityBanner municipalities={municipalities} />

      <section className="px-4 pb-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">{t("featuredRoutes")}</h2>
          <Link href="/rutas" className="text-accent text-sm underline">
            {t("featuredRoutes")} →
          </Link>
        </div>
        {routes.length > 0 && (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {routes.map((route) => (
              <li key={route.id}>
                <RouteCard route={route} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
