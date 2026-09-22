import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { resolveLocale } from "@/i18n/utils";
import { listRoutes } from "@/lib/data/routes";
import { RouteCard } from "@/components/route/route-card";
import { EmptyState } from "@/components/ui/empty-state";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RoutesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations("route");
  const tHome = await getTranslations("home");

  const routes = await listRoutes(locale);

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-8">
      <h1 className="text-2xl font-semibold">{tHome("featuredRoutes")}</h1>
      {routes.length === 0 ? (
        <EmptyState>{t("noResults")}</EmptyState>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {routes.map((route) => (
            <li key={route.id}>
              <RouteCard route={route} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
