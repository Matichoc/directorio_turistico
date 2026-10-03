import Link from "next/link";
import { PageHero } from "@/components/ui/page-hero";
import { listAdminRoutes } from "@/lib/data/routes";
import { setRoutePublicationStatus } from "@/lib/server/content/routes";
import type { PublicationStatus } from "@/types/database";

const STATUS_LABELS: Record<PublicationStatus, string> = {
  draft: "Borrador",
  published: "Publicado",
  archived: "Desactivado",
};

const STATUS_STYLES: Record<PublicationStatus, string> = {
  draft: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  published:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  archived: "bg-black/10 text-foreground/60 dark:bg-white/10",
};

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function AdminRoutesPage() {
  const routes = await listAdminRoutes();

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        title="Rutas"
        subtitle={`${routes.length} ruta${routes.length === 1 ? "" : "s"} en el catálogo.`}
      >
        <Link
          href="/admin/rutas/nuevo"
          className="bg-accent text-accent-foreground mt-2 inline-block w-fit rounded-full px-4 py-2 text-sm font-medium"
        >
          + Nueva ruta
        </Link>
      </PageHero>

      {routes.length === 0 ? (
        <p className="text-foreground/60 text-sm">Todavía no hay rutas.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {routes.map((route) => {
            const isActive = route.publicationStatus === "published";
            const nextStatus = isActive ? "archived" : "published";
            return (
              <li
                key={route.id}
                className="border-accent-soft hover:border-accent flex items-center justify-between gap-3 rounded-xl border p-3 text-sm transition-all hover:shadow-[0_0_20px_2px_var(--accent-soft)] dark:border-white/10"
              >
                <Link
                  href={`/admin/rutas/${route.id}`}
                  className="flex min-w-0 flex-1 flex-col"
                >
                  <span className="truncate font-medium">{route.name}</span>
                  <span className="text-foreground/60 truncate text-xs">
                    {route.stopsCount} parada{route.stopsCount === 1 ? "" : "s"}
                  </span>
                  <span className="text-foreground/40 text-[11px]">
                    {STATUS_LABELS[route.publicationStatus]} desde{" "}
                    {dateFormatter.format(new Date(route.statusChangedAt))}
                  </span>
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[route.publicationStatus]}`}
                  >
                    {STATUS_LABELS[route.publicationStatus]}
                  </span>
                  <form
                    action={setRoutePublicationStatus.bind(
                      null,
                      route.id,
                      nextStatus,
                    )}
                  >
                    <button
                      type="submit"
                      className="border-accent-soft hover:border-accent rounded-full border px-3 py-1 text-xs font-medium dark:border-white/15"
                    >
                      {isActive ? "Desactivar" : "Activar"}
                    </button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
