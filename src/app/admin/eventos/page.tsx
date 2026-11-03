import Link from "next/link";
import { PageHero } from "@/components/ui/page-hero";
import { listAdminEvents } from "@/lib/data/events";

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  timeZone: "UTC",
  day: "numeric",
  month: "short",
  year: "numeric",
});
const monthFormatter = new Intl.DateTimeFormat("es-CL", {
  timeZone: "UTC",
  month: "long",
});

function whenLabel(startsOn: string | null, usualMonth: number | null) {
  const parts: string[] = [];
  if (startsOn) {
    parts.push(dateFormatter.format(new Date(`${startsOn}T12:00:00Z`)));
  }
  if (usualMonth) {
    parts.push(
      `cada año en ${monthFormatter.format(new Date(Date.UTC(2026, usualMonth - 1, 15)))}`,
    );
  }
  return parts.join(" · ");
}

export default async function AdminEventsPage() {
  const events = await listAdminEvents();

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        title="Eventos"
        subtitle={`${events.length} evento${events.length === 1 ? "" : "s"} en "Qué pasa en Petorca". Cada uno con fecha confirmada o con el mes en que se hace cada año, y su fuente.`}
      >
        <Link
          href="/admin/eventos/nuevo"
          className="bg-accent text-accent-foreground mt-2 inline-block w-fit rounded-full px-4 py-2 text-sm font-medium"
        >
          + Nuevo evento
        </Link>
      </PageHero>

      {events.length === 0 ? (
        <p className="text-foreground/60 text-sm">
          Todavía no hay eventos (o falta correr{" "}
          <code>supabase/manual/eventos.sql</code>).
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href={`/admin/eventos/${event.id}`}
                className="border-accent-soft hover:border-accent flex items-center justify-between gap-3 rounded-xl border p-3 text-sm transition-all hover:shadow-[0_0_20px_2px_var(--accent-soft)] dark:border-white/10"
              >
                <div className="flex min-w-0 flex-col">
                  <span className="truncate font-medium">{event.name}</span>
                  <span className="text-foreground/60 truncate text-xs">
                    {whenLabel(event.startsOn, event.usualMonth)}
                  </span>
                </div>
                {(!event.published || !event.hasSource) && (
                  <span className="flex shrink-0 gap-1 text-[11px] text-amber-300">
                    {!event.published && (
                      <span className="rounded-full bg-amber-900/30 px-2 py-0.5">
                        no publicado
                      </span>
                    )}
                    {!event.hasSource && (
                      <span className="rounded-full bg-amber-900/30 px-2 py-0.5">
                        sin fuente
                      </span>
                    )}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
