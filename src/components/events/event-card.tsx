import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  eventBadge,
  formatEventDates,
  isUpcoming,
  monthName,
} from "@/lib/events/agenda";
import { getArtPosition, isAiArt } from "@/lib/ui/scene-backgrounds";
import { AiArtLabel } from "@/components/ui/ai-art-label";
import type { Locale } from "@/types/database";
import type { SiteEvent } from "@/types/domain";

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Tarjeta de un evento (página /eventos, inicio y fichas de pueblo y de
 * lugar): calendario chico con el día y el mes, nombre, cuándo, dónde (con
 * link si el pueblo o el lugar existen en el sitio), quién organiza y la
 * fuente. Solo lo que trae el dato: sin fecha confirmada dice "fecha por
 * confirmar", nunca un día inventado. `compact` corta la descripción.
 */
export async function EventCard({
  event,
  locale,
  today,
  compact = false,
}: {
  event: SiteEvent;
  locale: Locale;
  today: string;
  compact?: boolean;
}) {
  const t = await getTranslations({ locale, namespace: "events" });
  const upcoming = isUpcoming(event, today);
  const badge = eventBadge(event, locale, today);
  const dates = formatEventDates(event, locale);

  const months =
    event.usualMonth === null
      ? null
      : event.usualMonthEnd && event.usualMonthEnd !== event.usualMonth
        ? t("monthRange", {
            from: monthName(event.usualMonth, locale),
            to: monthName(event.usualMonthEnd, locale),
          })
        : monthName(event.usualMonth, locale);

  // Fecha confirmada (próxima o de un evento de una vez) o, en una fiesta de
  // cada año, lo que diga la fuente ("Fines de octubre") o el mes.
  const showDate = dates && (upcoming || event.usualMonth === null);
  const when = showDate
    ? `${capitalize(dates)}${event.startTime ? ` · ${t("at", { time: event.startTime })}` : ""}`
    : capitalize(event.whenNote ?? months ?? "");
  const detail = showDate
    ? null
    : dates
      ? t("last", { date: dates })
      : t("dateToConfirm");

  return (
    <article
      className={`surface-glass flex flex-col overflow-hidden rounded-2xl border transition-all hover:shadow-[0_0_20px_2px_var(--accent-soft)] ${
        upcoming ? "border-accent/60" : "border-white/10"
      }`}
    >
      <div className="flex gap-3 p-4 pb-2">
        <div
          aria-hidden="true"
          className={`flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-xl border text-center ${
            upcoming
              ? "border-accent bg-accent/15 shadow-[0_0_14px_var(--accent-soft)]"
              : "border-white/15 bg-white/5"
          }`}
        >
          {badge.day && (
            <span className="text-xl leading-none font-semibold">
              {badge.day}
            </span>
          )}
          <span
            className={`text-xs font-medium uppercase ${upcoming ? "text-accent" : "text-foreground/70"}`}
          >
            {badge.month}
          </span>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="leading-snug font-semibold">{event.name}</h3>
          {when && <p className="text-accent text-sm">{when}</p>}
          {detail && <p className="text-foreground/50 text-xs">{detail}</p>}
          {(event.place || event.locality) && (
            <p className="text-foreground/70 text-sm">
              {event.place && (
                <Link
                  href={{
                    pathname: "/lugares/[slug]",
                    params: { slug: event.place.slug },
                  }}
                  className="hover:text-accent underline underline-offset-2"
                >
                  {event.place.name}
                </Link>
              )}
              {event.place && event.locality && " · "}
              {event.locality && (
                <Link
                  href={{
                    pathname: "/pueblos/[slug]",
                    params: { slug: event.locality.slug },
                  }}
                  className="hover:text-accent underline underline-offset-2"
                >
                  {event.locality.name}
                </Link>
              )}
            </p>
          )}
        </div>
        {event.coverImage && (
          // Recuadro chico al lado del texto (pedido del usuario: la portada
          // como afiche entero "se ve muy grande"; mejor "más chiquitita, en
          // recuadros").
          <div
            className={`relative shrink-0 self-start overflow-hidden rounded-xl border border-white/10 ${
              compact ? "h-16 w-16" : "h-20 w-20 sm:h-28 sm:w-28"
            }`}
          >
            <Image
              src={event.coverImage}
              alt=""
              fill
              sizes="112px"
              // Una foto subida al Storage del panel no pasa por el optimizador
              // (no todos sus orígenes están declarados en next.config.ts).
              unoptimized={!event.coverImage.startsWith("/")}
              className="object-cover"
              style={{ objectPosition: getArtPosition(event.coverImage) }}
            />
            {isAiArt(event.coverImage) && (
              <AiArtLabel short className="right-1 bottom-1" />
            )}
          </div>
        )}
      </div>
      {/* Descripción, organizador y fuente, a todo el ancho: al lado de la
          fecha y la miniatura el texto quedaba en una columna angosta. */}
      <div className="flex flex-col gap-1 px-4 pb-4">
        {event.description && (
          <p
            className={`text-foreground/80 text-sm leading-relaxed ${compact ? "line-clamp-2" : ""}`}
          >
            {event.description}
          </p>
        )}
        {!compact && event.organizer && (
          <p className="text-foreground/60 text-xs">
            {t("organizer", { name: event.organizer })}
          </p>
        )}
        {!compact && event.sourceUrl && (
          <p className="text-foreground/50 text-xs">
            {t("source")}:{" "}
            <a
              href={event.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent underline underline-offset-2"
            >
              {event.sourceLabel ?? event.sourceUrl}
            </a>
          </p>
        )}
      </div>
    </article>
  );
}
