import { describe, expect, it } from "vitest";
import {
  agendaHighlights,
  buildAgenda,
  eventBadge,
  formatEventDates,
  monthsUntil,
  todayInChile,
} from "@/lib/events/agenda";
import type { SiteEvent } from "@/types/domain";

function event(overrides: Partial<SiteEvent> & { slug: string }): SiteEvent {
  return {
    id: overrides.slug,
    name: overrides.slug,
    description: null,
    whenNote: null,
    startsOn: null,
    endsOn: null,
    startTime: null,
    usualMonth: null,
    usualMonthEnd: null,
    organizer: null,
    sourceUrl: null,
    sourceLabel: null,
    coverImage: null,
    locality: null,
    place: null,
    ...overrides,
  };
}

const TODAY = "2026-11-02";

const cocinando = event({
  slug: "cocinando",
  startsOn: "2026-10-31",
  usualMonth: 10,
});
const merced = event({ slug: "merced", usualMonth: 9 });
const veranada = event({ slug: "veranada", usualMonth: 12, usualMonthEnd: 4 });
const clubAniversario = event({ slug: "club", startsOn: "2026-08-15" });
const feria = event({
  slug: "feria",
  startsOn: "2026-11-20",
  endsOn: "2026-11-22",
});
const hoyTermina = event({
  slug: "hoy",
  startsOn: "2026-10-30",
  endsOn: "2026-11-02",
});

describe("buildAgenda", () => {
  const agenda = buildAgenda(
    [cocinando, merced, veranada, clubAniversario, feria, hoyTermina],
    TODAY,
  );

  it("lists what still has to happen (or ends today) as upcoming, soonest first", () => {
    expect(agenda.upcoming.map((e) => e.slug)).toEqual(["hoy", "feria"]);
  });

  it("keeps yearly festivals without an upcoming date, from this month on", () => {
    // Noviembre: la veranada (diciembre) viene antes que la Merced (septiembre)
    // y Cocinando (octubre, ya pasó este año).
    expect(agenda.yearly.map((e) => e.slug)).toEqual([
      "veranada",
      "merced",
      "cocinando",
    ]);
  });

  it("sends one-off events whose date passed to past, newest first", () => {
    expect(agenda.past.map((e) => e.slug)).toEqual(["club"]);
  });

  it("never shows an event twice", () => {
    const all = [...agenda.upcoming, ...agenda.yearly, ...agenda.past];
    expect(new Set(all.map((e) => e.slug)).size).toBe(all.length);
  });

  it("moves a yearly festival to upcoming once its next date is set", () => {
    const next = { ...cocinando, startsOn: "2027-10-30" };
    const later = buildAgenda([next], TODAY);
    expect(later.upcoming).toEqual([next]);
    expect(later.yearly).toEqual([]);
  });

  it("highlights upcoming first, then the coming yearly ones, never the past", () => {
    expect(agendaHighlights(agenda, 3).map((e) => e.slug)).toEqual([
      "hoy",
      "feria",
      "veranada",
    ]);
  });
});

describe("monthsUntil", () => {
  it("is 0 while a season that spans the new year is running", () => {
    expect(monthsUntil(veranada, 1)).toBe(0);
    expect(monthsUntil(veranada, 12)).toBe(0);
    expect(monthsUntil(veranada, 5)).toBe(7);
  });
});

describe("dates", () => {
  it("formats a single day with its weekday, in each language", () => {
    expect(formatEventDates(cocinando, "es")).toBe(
      "sábado, 31 de octubre de 2026",
    );
    expect(formatEventDates(cocinando, "en")).toMatch(/Saturday, October 31/);
  });

  it("formats a range of days", () => {
    expect(formatEventDates(feria, "es")).toMatch(
      /20.*22 de noviembre de 2026/,
    );
  });

  it("shows only the month on a yearly festival whose last date passed", () => {
    expect(eventBadge(cocinando, "es", TODAY)).toEqual({
      day: null,
      month: "oct",
    });
    expect(eventBadge(feria, "es", TODAY).day).toBe("20");
  });

  it("knows today's date in Chile, not in UTC", () => {
    // 02:00 UTC del 3 de noviembre todavía es el 2 en Chile.
    expect(todayInChile(new Date("2026-11-03T02:00:00Z"))).toBe("2026-11-02");
  });
});
