import { getTranslations, setRequestLocale } from "next-intl/server";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { HomeSearchForm } from "@/components/home/home-search-form";
import { RouteCard } from "@/components/route/route-card";
import { CategoryIcon } from "@/components/ui/category-icon";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { resolveLocale } from "@/i18n/utils";
import { listRoutes } from "@/lib/data/routes";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const INTENT_CATEGORIES = [
  { slug: "naturaleza", key: "nature" as const, icon: "mountain" },
  { slug: "gastronomia", key: "gastronomy" as const, icon: "utensils" },
  { slug: "cultura", key: "culture" as const, icon: "landmark" },
  { slug: "playa", key: "beach" as const, icon: "waves" },
];

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);

  const [t, routes] = await Promise.all([
    getTranslations("home"),
    listRoutes(locale, 3),
  ]);

  return (
    <main className="flex flex-1 flex-col gap-8">
      <div className="from-accent-soft to-background border-accent-soft flex flex-col gap-6 border-b bg-gradient-to-b px-4 pt-8 pb-10 dark:from-accent-soft/40">
        <header className="flex items-start justify-between gap-4">
          <p className="text-accent text-xs font-semibold tracking-wide uppercase">
            Petorca · La Ligua
          </p>
          <LocaleSwitcher />
        </header>

        <h1 className="text-3xl leading-tight font-semibold text-balance">
          {t("title")}
        </h1>
        <p className="text-foreground/70 max-w-prose">{t("subtitle")}</p>

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
                className="border-accent-soft hover:border-accent hover:bg-accent-soft/40 flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-colors dark:border-white/10"
              >
                <span className="bg-accent-soft text-accent flex h-10 w-10 items-center justify-center rounded-full">
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
