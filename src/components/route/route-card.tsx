import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { RouteCard as RouteCardType } from "@/types/domain";

export function RouteCard({ route }: { route: RouteCardType }) {
  const t = useTranslations("route");

  return (
    <Link
      href={{ pathname: "/rutas/[slug]", params: { slug: route.slug } }}
      className="flex flex-col gap-2 rounded-xl border border-black/10 p-4 transition-colors hover:border-black/30 dark:border-white/10 dark:hover:border-white/30"
    >
      <h3 className="font-medium">{route.name}</h3>
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
