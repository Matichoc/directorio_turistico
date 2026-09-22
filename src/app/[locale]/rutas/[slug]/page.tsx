import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getRouteBySlug } from "@/lib/data/routes";
import { resolveLocale } from "@/i18n/utils";

export default async function RouteDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations("route");

  const route = await getRouteBySlug(slug, locale);
  if (!route) {
    notFound();
  }

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-8">
      <h1 className="text-2xl font-semibold">{route.name}</h1>
      <p className="text-foreground/60">{route.description}</p>
      <p className="text-foreground/50 text-sm">
        {t("stops")}: {route.stops.length}
      </p>
    </main>
  );
}
