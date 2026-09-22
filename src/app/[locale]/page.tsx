import { getTranslations, setRequestLocale } from "next-intl/server";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { HomeSearchForm } from "@/components/home/home-search-form";
import { RouteCard } from "@/components/route/route-card";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { resolveLocale } from "@/i18n/utils";
import { listRoutes } from "@/lib/data/routes";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const INTENT_CATEGORIES = [
  { slug: "naturaleza", key: "nature" as const },
  { slug: "gastronomia", key: "gastronomy" as const },
  { slug: "cultura", key: "culture" as const },
  { slug: "playa", key: "beach" as const },
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
    <main className="flex flex-1 flex-col gap-8 px-4 py-8">
      <header className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <LocaleSwitcher />
      </header>

      <p className="text-foreground/70 max-w-prose">{t("subtitle")}</p>

      <HomeSearchForm />

      <section>
        <h2 className="mb-3 text-lg font-medium">{t("intent.title")}</h2>
        <ul className="flex flex-wrap gap-2">
          {INTENT_CATEGORIES.map((intent) => (
            <li key={intent.slug}>
              <Link
                href={{
                  pathname: "/explorar",
                  query: { categoria: intent.slug },
                }}
                className="inline-block rounded-full border border-black/10 px-4 py-2 text-sm dark:border-white/20"
              >
                {t(`intent.${intent.key}`)}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-medium">{t("featuredRoutes")}</h2>
          <Link href="/rutas" className="text-foreground/60 text-sm underline">
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
