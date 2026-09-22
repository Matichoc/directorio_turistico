import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { RouteCard as RouteCardType } from "@/types/domain";

export function RouteCard({ route }: { route: RouteCardType }) {
  const t = useTranslations("route");

  return (
    <Link
      href={{ pathname: "/rutas/[slug]", params: { slug: route.slug } }}
      className="border-accent-soft hover:border-accent flex flex-col gap-2 rounded-2xl border bg-black/[.015] p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/[.03]"
    >
      <h3 className="text-accent font-medium">{route.name}</h3>
      {route.description && (
        <p className="text-foreground/70 line-clamp-2 text-sm">
          {route.description}
        </p>
      )}
      <p className="text-foreground/60 text-sm">
        {t("stops")}: {route.stopsCount}
        {route.estimatedDurationMinutes
          ? ` · ${t("duration")}: ${Math.round(route.estimatedDurationMinutes / 60)}h`
          : ""}
      </p>
    </Link>
  );
}
