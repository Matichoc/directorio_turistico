import { PageHero } from "@/components/ui/page-hero";
import { listAdminPlaces } from "@/lib/data/places";
import { listAdminRoutes } from "@/lib/data/routes";
import { listAdminLocalities } from "@/lib/data/localities";
import {
  getAnalyticsTop,
  getAnalyticsTotals,
  type AnalyticsRow,
} from "@/lib/data/analytics";

const DAYS = 30;

function TopList({
  title,
  rows,
  label = (value: string) => value,
}: {
  title: string;
  rows: AnalyticsRow[];
  label?: (value: string) => string;
}) {
  return (
    <section className="surface-glass flex flex-col gap-2 rounded-2xl p-4">
      <h2 className="text-sm font-medium">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-foreground/50 text-xs">Sin datos todavía.</p>
      ) : (
        <ol className="flex flex-col gap-1 text-sm">
          {rows.map((row) => (
            <li
              key={row.value}
              className="flex items-baseline justify-between gap-3"
            >
              <span className="truncate">{label(row.value)}</span>
              <span className="text-foreground/60 shrink-0 text-xs tabular-nums">
                {row.total}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/**
 * Métricas de uso de los últimos 30 días, para mostrarle a turismo qué se
 * mira y qué se busca. Los eventos son anónimos (ver `/api/analytics`); el
 * conteo se arma en la base (`analytics_top`/`analytics_totals`, migración
 * 0023) porque PostgREST corta las respuestas en 1.000 filas.
 */
export default async function AdminMetricsPage() {
  const [
    totals,
    placeViews,
    routeViews,
    localityViews,
    tripAdds,
    likes,
    searches,
    communes,
    categories,
    places,
    routes,
    localities,
  ] = await Promise.all([
    getAnalyticsTotals(DAYS),
    getAnalyticsTop("place_view", "slug", DAYS),
    getAnalyticsTop("route_view", "slug", DAYS),
    getAnalyticsTop("locality_view", "slug", DAYS),
    getAnalyticsTop("place_added_to_trip", "placeId", DAYS),
    getAnalyticsTop("place_liked", "placeId", DAYS),
    getAnalyticsTop("search_performed", "q", DAYS),
    getAnalyticsTop("filter_applied", "comuna", DAYS, 5),
    getAnalyticsTop("filter_applied", "categoria", DAYS, 5),
    listAdminPlaces(),
    listAdminRoutes(),
    listAdminLocalities(),
  ]);

  const placeBySlug = new Map(places.map((p) => [p.slug, p.name]));
  const placeById = new Map(places.map((p) => [p.id, p.name]));
  const routeBySlug = new Map(routes.map((r) => [r.slug, r.name]));
  const localityBySlug = new Map(localities.map((l) => [l.slug, l.name]));

  const cards: { label: string; value: number }[] = [
    { label: "Vistas de lugares", value: totals.place_view ?? 0 },
    { label: "Vistas de rutas", value: totals.route_view ?? 0 },
    { label: "Vistas de pueblos", value: totals.locality_view ?? 0 },
    { label: "Búsquedas", value: totals.search_performed ?? 0 },
    { label: "Me gusta", value: totals.place_liked ?? 0 },
    {
      label: "Agregados a un recorrido",
      value:
        (totals.place_added_to_trip ?? 0) + (totals.route_added_to_trip ?? 0),
    },
  ];
  const hasData = Object.keys(totals).length > 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        title="Métricas"
        subtitle={`Uso del sitio en los últimos ${DAYS} días. Eventos anónimos: no se guarda quién fue.`}
      />

      {!hasData && (
        <p className="text-foreground/60 text-sm">
          Todavía no hay eventos. Se empiezan a registrar apenas el sitio tenga
          visitas (requiere aplicar la migración 0023).
        </p>
      )}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cards.map((card) => (
          <li
            key={card.label}
            className="surface-glass flex flex-col gap-1 rounded-2xl p-4"
          >
            <span className="text-2xl font-semibold tabular-nums">
              {card.value}
            </span>
            <span className="text-foreground/60 text-xs">{card.label}</span>
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <TopList
          title="Lugares más vistos"
          rows={placeViews}
          label={(slug) => placeBySlug.get(slug) ?? slug}
        />
        <TopList
          title="Rutas más vistas"
          rows={routeViews}
          label={(slug) => routeBySlug.get(slug) ?? slug}
        />
        <TopList
          title="Pueblos más vistos"
          rows={localityViews}
          label={(slug) => localityBySlug.get(slug) ?? slug}
        />
        <TopList
          title="Lugares más agregados al recorrido"
          rows={tripAdds}
          label={(id) => placeById.get(id) ?? id}
        />
        <TopList
          title="Lugares con más me gusta"
          rows={likes}
          label={(id) => placeById.get(id) ?? id}
        />
        <TopList title="Lo que más se busca" rows={searches} />
        <TopList title="Comunas más filtradas" rows={communes} />
        <TopList title="Categorías más filtradas" rows={categories} />
      </div>
    </div>
  );
}
