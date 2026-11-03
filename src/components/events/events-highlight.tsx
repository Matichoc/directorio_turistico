import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CategoryIcon } from "@/components/ui/category-icon";
import { EventCard } from "@/components/events/event-card";
import { agendaHighlights, buildAgenda } from "@/lib/events/agenda";
import type { Locale } from "@/types/database";
import type { SiteEvent } from "@/types/domain";

/**
 * Bloque "Qué pasa en Petorca" para el inicio y las fichas de pueblo y de
 * lugar: lo próximo con fecha y, después, las fiestas de cada año que vienen
 * (nunca lo que ya pasó), con "Ver todos los eventos". Sin eventos no se
 * muestra nada.
 */
export async function EventsHighlight({
  events,
  locale,
  today,
  title,
  limit = 3,
}: {
  events: SiteEvent[];
  locale: Locale;
  today: string;
  title: string;
  limit?: number;
}) {
  const items = agendaHighlights(buildAgenda(events, today), limit);
  if (items.length === 0) return null;
  const t = await getTranslations({ locale, namespace: "events" });

  return (
    <section className="reveal flex flex-col gap-3">
      <h2 className="flex items-center gap-2 text-lg font-medium">
        <CategoryIcon icon="calendario" className="text-accent h-5 w-5" />
        {title}
      </h2>
      <ul className="flex flex-col gap-3">
        {items.map((event) => (
          <li key={event.id}>
            <EventCard event={event} locale={locale} today={today} compact />
          </li>
        ))}
      </ul>
      <Link href="/eventos" className="text-accent w-fit text-sm font-semibold">
        {t("seeAll")} →
      </Link>
    </section>
  );
}
