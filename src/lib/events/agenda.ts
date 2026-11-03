import { SPEECH_LANG } from "@/lib/speech";
import type { Locale } from "@/types/database";
import type { SiteEvent } from "@/types/domain";

/**
 * Cómo se ordena "Qué pasa en Petorca" (página /eventos). Funciones puras,
 * con pruebas (`tests/unit/events-agenda.test.ts`):
 *
 * - **Próximos**: con fecha confirmada que todavía no termina.
 * - **Cada año**: las fiestas que se repiten (`usualMonth`) y no tienen una
 *   fecha próxima confirmada, desde el mes actual en adelante. Si ya se hizo
 *   alguna vez con fecha, la tarjeta la muestra como "la última".
 * - **Ya pasaron**: eventos de una sola vez cuya fecha ya pasó, del más
 *   nuevo al más viejo (así queda la historia; nada se borra solo).
 *
 * Un evento cae en una sola de las tres: nunca se ve repetido.
 */
export interface EventAgenda {
  upcoming: SiteEvent[];
  yearly: SiteEvent[];
  past: SiteEvent[];
}

/** Hoy en Chile, `YYYY-MM-DD` (el servidor corre en UTC). */
export function todayInChile(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Santiago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function lastDay(event: SiteEvent): string | null {
  return event.endsOn ?? event.startsOn;
}

export function isUpcoming(event: SiteEvent, today: string): boolean {
  const end = lastDay(event);
  return end !== null && end >= today;
}

function inMonthRange(month: number, from: number, to: number): boolean {
  return from <= to
    ? month >= from && month <= to
    : month >= from || month <= to;
}

/** Meses que faltan para que empiece (0 si es este mes o si ya está en curso). */
export function monthsUntil(event: SiteEvent, currentMonth: number): number {
  const from = event.usualMonth;
  if (from === null) return 12;
  const to = event.usualMonthEnd ?? from;
  if (inMonthRange(currentMonth, from, to)) return 0;
  return (from - currentMonth + 12) % 12;
}

export function buildAgenda(events: SiteEvent[], today: string): EventAgenda {
  const currentMonth = Number(today.slice(5, 7));
  const upcoming = events
    .filter((event) => isUpcoming(event, today))
    .sort((a, b) => (a.startsOn ?? "").localeCompare(b.startsOn ?? ""));
  const yearly = events
    .filter((event) => event.usualMonth !== null && !isUpcoming(event, today))
    .sort(
      (a, b) =>
        monthsUntil(a, currentMonth) - monthsUntil(b, currentMonth) ||
        a.name.localeCompare(b.name),
    );
  const past = events
    .filter(
      (event) =>
        event.usualMonth === null &&
        event.startsOn !== null &&
        !isUpcoming(event, today),
    )
    .sort((a, b) => (b.startsOn ?? "").localeCompare(a.startsOn ?? ""));
  return { upcoming, yearly, past };
}

/**
 * Lo que va en el inicio y en las fichas: primero lo que tiene fecha
 * próxima, después las fiestas de cada año que vienen. Nunca lo que ya pasó.
 */
export function agendaHighlights(
  agenda: EventAgenda,
  limit: number,
): SiteEvent[] {
  return [...agenda.upcoming, ...agenda.yearly].slice(0, limit);
}

function dateLocale(locale: Locale): string {
  return SPEECH_LANG[locale] ?? SPEECH_LANG.es;
}

/** `YYYY-MM-DD` como fecha a mediodía UTC: sin corrimientos de zona horaria. */
function parseDay(day: string): Date {
  return new Date(`${day}T12:00:00Z`);
}

/** "sábado, 31 de octubre de 2026" o "31 de octubre – 2 de noviembre de 2026". */
export function formatEventDates(
  event: SiteEvent,
  locale: Locale,
): string | null {
  if (!event.startsOn) return null;
  const format = new Intl.DateTimeFormat(dateLocale(locale), {
    timeZone: "UTC",
    ...(event.endsOn && event.endsOn !== event.startsOn
      ? { day: "numeric", month: "long", year: "numeric" }
      : { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
  });
  if (event.endsOn && event.endsOn !== event.startsOn) {
    return format.formatRange(parseDay(event.startsOn), parseDay(event.endsOn));
  }
  return format.format(parseDay(event.startsOn));
}

/** Nombre del mes ("septiembre"), en el idioma del sitio. */
export function monthName(month: number, locale: Locale): string {
  return new Intl.DateTimeFormat(dateLocale(locale), {
    timeZone: "UTC",
    month: "long",
  }).format(new Date(Date.UTC(2026, month - 1, 15)));
}

/**
 * Día y mes para el calendario chico de la tarjeta: la fecha si es próxima
 * (o si es un evento de una vez que ya pasó); en una fiesta de cada año sin
 * fecha próxima, solo el mes — nunca el día de la vez anterior.
 */
export function eventBadge(
  event: SiteEvent,
  locale: Locale,
  today: string,
): { day: string | null; month: string } {
  const shortMonth = new Intl.DateTimeFormat(dateLocale(locale), {
    timeZone: "UTC",
    month: "short",
  });
  if (
    event.startsOn &&
    (isUpcoming(event, today) || event.usualMonth === null)
  ) {
    const date = parseDay(event.startsOn);
    return {
      day: String(date.getUTCDate()),
      month: shortMonth.format(date).replace(".", ""),
    };
  }
  return {
    day: null,
    month: shortMonth
      .format(new Date(Date.UTC(2026, (event.usualMonth ?? 1) - 1, 15)))
      .replace(".", ""),
  };
}
