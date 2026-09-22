import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getRouteBySlug } from "@/lib/data/routes";
import { resolveLocale } from "@/i18n/utils";
import { Link } from "@/i18n/navigation";

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

  const hours = route.estimatedDurationMinutes
    ? Math.round((route.estimatedDurationMinutes / 60) * 10) / 10
    : null;

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">{route.name}</h1>
        {hours && (
          <p className="text-foreground/60 text-sm">
            {t("duration")}: {hours}h
          </p>
        )}
      </header>

      {route.description && (
        <p className="text-foreground/70">{route.description}</p>
      )}

      <div>
        <h2 className="text-foreground/50 mb-2 text-sm font-medium">
          {t("stops")} ({route.stops.length})
        </h2>
        <ol className="flex flex-col gap-2">
          {route.stops.map((stop, index) => (
            <li key={stop.id}>
              <Link
                href={{
                  pathname: "/lugares/[slug]",
                  params: { slug: stop.placeSlug },
                }}
                className="flex items-center gap-3 rounded-lg border border-black/10 px-3 py-2 text-sm hover:border-black/30 dark:border-white/10 dark:hover:border-white/30"
              >
                <span className="bg-foreground text-background flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs">
                  {index + 1}
                </span>
                {stop.placeName}
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
