import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { RouteCard as RouteCardType } from "@/types/domain";

export function RouteCard({ route }: { route: RouteCardType }) {
  const t = useTranslations("route");

  return (
    <Link
      href={{ pathname: "/rutas/[slug]", params: { slug: route.slug } }}
      className="border-accent-soft hover:border-accent flex flex-col overflow-hidden rounded-2xl border bg-black/[.015] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-[0_0_20px_2px_var(--accent-soft)] dark:border-white/10 dark:bg-white/[.03]"
    >
      <div className="from-accent to-accent-soft flex h-16 items-center justify-center bg-gradient-to-br">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          className="text-accent-foreground h-7 w-7"
          aria-hidden="true"
        >
          <circle cx="6" cy="6" r="2.5" />
          <circle cx="18" cy="18" r="2.5" />
          <path d="M8.5 6H15a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h6.5" />
        </svg>
      </div>

      <div className="flex flex-col gap-2 p-4">
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
      </div>
    </Link>
  );
}
