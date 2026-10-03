import Link from "next/link";
import { PageHero } from "@/components/ui/page-hero";
import { listAdminPlaces } from "@/lib/data/places";
import { setPlacePublicationStatus } from "@/lib/server/content/places";
import { CsvImportForm } from "@/components/admin/csv-import-form";
import { importPlacesCsv } from "@/lib/server/content/places-bulk";
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

export default async function AdminPlacesPage() {
  const places = await listAdminPlaces();

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        title="Lugares"
        subtitle={`${places.length} lugar${places.length === 1 ? "" : "es"} en el catálogo.`}
      >
        <div className="mt-2 flex flex-wrap gap-2">
          <Link
            href="/admin/lugares/nuevo"
            className="bg-accent text-accent-foreground inline-block w-fit rounded-full px-4 py-2 text-sm font-medium"
          >
            + Nuevo lugar
          </Link>
          <Link
            href="/admin/lugares/export"
            className="inline-block w-fit rounded-full border border-white/30 px-4 py-2 text-sm font-medium text-white"
          >
            Descargar CSV
          </Link>
        </div>
      </PageHero>

      <CsvImportForm action={importPlacesCsv} entityLabel="lugares" />

      {places.length === 0 ? (
        <p className="text-foreground/60 text-sm">Todavía no hay lugares.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {places.map((place) => {
            const isActive = place.publicationStatus === "published";
            const nextStatus = isActive ? "archived" : "published";
            return (
              <li
                key={place.id}
                className="border-accent-soft hover:border-accent flex items-center justify-between gap-3 rounded-xl border p-3 text-sm transition-all hover:shadow-[0_0_20px_2px_var(--accent-soft)] dark:border-white/10"
              >
                <Link
                  href={`/admin/lugares/${place.id}`}
                  className="flex min-w-0 flex-1 flex-col"
                >
                  <span className="truncate font-medium">{place.name}</span>
                  <span className="text-foreground/60 truncate text-xs">
                    {place.communeName} · {place.categoryName}
                  </span>
                  <span className="text-foreground/40 text-[11px]">
                    {STATUS_LABELS[place.publicationStatus]} desde{" "}
                    {dateFormatter.format(new Date(place.statusChangedAt))}
                  </span>
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[place.publicationStatus]}`}
                  >
                    {STATUS_LABELS[place.publicationStatus]}
                  </span>
                  <form
                    action={setPlacePublicationStatus.bind(
                      null,
                      place.id,
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
