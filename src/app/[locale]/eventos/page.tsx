import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { resolveLocale } from "@/i18n/utils";
import { PageHero } from "@/components/ui/page-hero";
import { ListenButton } from "@/components/ui/listen-button";
import { EmptyState } from "@/components/ui/empty-state";
import { EventCard } from "@/components/events/event-card";
import { listEvents } from "@/lib/data/events";
import { buildAgenda, todayInChile } from "@/lib/events/agenda";
import { buildPageMetadata, truncateDescription } from "@/lib/seo";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "events" });
  return buildPageMetadata({
    locale,
    href: "/eventos",
    title: t("title"),
    description: truncateDescription(t("subtitle")),
  });
}

/**
 * "Qué pasa en Petorca" — pedido del usuario: un apartado de eventos
 * ("Cocinando con el Diablo", el aniversario de Petorca, el de un club…).
 * Tres partes (lib/events/agenda.ts): próximos con fecha, fiestas de cada
 * año (con el mes mientras no haya fecha) y los que ya pasaron. Los datos
 * los carga el equipo desde el panel (/admin/eventos), cada uno con su
 * fuente. La página se regenera cada 5 minutos (layout), así "hoy" avanza
 * solo y un evento pasa a "Ya pasaron" sin tocar nada.
 */
export default async function EventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations("events");

  const events = await listEvents(locale);
  const today = todayInChile();
  const agenda = buildAgenda(events, today);

  const sections = [
    { key: "upcoming", items: agenda.upcoming },
    { key: "yearly", items: agenda.yearly },
    { key: "past", items: agenda.past },
  ] as const;

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-8">
      <PageHero title={t("title")} subtitle={t("subtitle")} scene="pueblo" />

      {events.length === 0 ? (
        <EmptyState>{t("empty")}</EmptyState>
      ) : (
        <>
          <ListenButton
            name={t("title")}
            segments={[
              `${t("title")}.`,
              ...sections.flatMap(({ key, items }) =>
                items.length > 0
                  ? [
                      `${t(key)}.`,
                      ...items.flatMap((event) => [
                        `${event.name}.`,
                        event.description,
                      ]),
                    ]
                  : [],
              ),
            ]}
          />

          {sections.map(({ key, items }) => {
            if (items.length === 0 && key !== "upcoming") return null;
            return (
              <section key={key} className="reveal flex flex-col gap-3">
                <h2 className="font-display text-xl font-semibold">{t(key)}</h2>
                {key === "yearly" && (
                  <p className="text-foreground/60 text-sm">
                    {t("yearlyIntro")}
                  </p>
                )}
                {items.length === 0 ? (
                  <p className="text-foreground/60 text-sm">
                    {t("noUpcoming")}
                  </p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {items.map((event) => (
                      <li key={event.id} id={event.slug}>
                        <EventCard
                          event={event}
                          locale={locale}
                          today={today}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </>
      )}
    </main>
  );
}
