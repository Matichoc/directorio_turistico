import Link from "next/link";
import { PageHero } from "@/components/ui/page-hero";
import { listAdminLocalities } from "@/lib/data/localities";

export default async function AdminLocalitiesPage() {
  const localities = await listAdminLocalities();

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        title="Pueblos"
        subtitle={`${localities.length} pueblo${localities.length === 1 ? "" : "s"} en el catálogo.`}
      >
        <Link
          href="/admin/pueblos/nuevo"
          className="bg-accent text-accent-foreground mt-2 inline-block w-fit rounded-full px-4 py-2 text-sm font-medium"
        >
          + Nuevo pueblo
        </Link>
      </PageHero>

      {localities.length === 0 ? (
        <p className="text-foreground/60 text-sm">Todavía no hay pueblos.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {localities.map((locality) => (
            <li key={locality.id}>
              <Link
                href={`/admin/pueblos/${locality.id}`}
                className="border-accent-soft hover:border-accent flex items-center justify-between gap-3 rounded-xl border p-3 text-sm transition-all hover:shadow-[0_0_20px_2px_var(--accent-soft)] dark:border-white/10"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{locality.name}</span>
                  <span className="text-foreground/60 truncate text-xs">
                    {locality.communeName}
                  </span>
                </div>
                <span className="text-foreground/50 shrink-0 text-xs">
                  {locality.placesCount} lugar
                  {locality.placesCount === 1 ? "" : "es"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
