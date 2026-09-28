import { notFound, redirect } from "next/navigation";
import { PageHero } from "@/components/ui/page-hero";
import { RouteForm } from "@/components/admin/route-form";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { getAdminRouteById } from "@/lib/data/routes";
import { listAdminPlaces } from "@/lib/data/places";
import {
  addRouteStop,
  deleteRoute,
  moveRouteStop,
  removeRouteStop,
} from "@/lib/server/content/routes";

export default async function EditAdminRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [route, allPlaces] = await Promise.all([
    getAdminRouteById(id),
    listAdminPlaces(),
  ]);

  if (!route) {
    notFound();
  }

  const routeId = route.id;
  async function deleteAndRedirect() {
    "use server";
    await deleteRoute(routeId);
    redirect("/admin/rutas");
  }

  const stopPlaceIds = new Set(route.stops.map((stop) => stop.placeId));
  const availablePlaces = allPlaces.filter(
    (place) => !stopPlaceIds.has(place.id),
  );
  const addStop = addRouteStop.bind(null, route.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        title={route.translations.es.name || route.slug}
        subtitle="Editar ruta."
      />
      <RouteForm route={route} />

      <section className="flex flex-col gap-3">
        <h2 className="text-foreground/50 text-sm font-medium">Paradas</h2>

        {route.stops.length === 0 ? (
          <p className="text-foreground/60 text-sm">
            Esta ruta todavía no tiene paradas.
          </p>
        ) : (
          <ol className="flex flex-col gap-2">
            {route.stops.map((stop, index) => (
              <li
                key={stop.id}
                className="border-accent-soft flex items-center gap-3 rounded-xl border p-3 text-sm dark:border-white/10"
              >
                <span className="border-foreground/30 text-foreground/50 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-medium">
                  {index + 1}
                </span>
                <span className="flex-1 font-medium">{stop.placeName}</span>
                <form action={moveRouteStop.bind(null, route.id, stop.id, -1)}>
                  <button
                    type="submit"
                    disabled={index === 0}
                    aria-label="Subir"
                    className="text-foreground/60 hover:text-foreground disabled:opacity-25"
                  >
                    ▲
                  </button>
                </form>
                <form action={moveRouteStop.bind(null, route.id, stop.id, 1)}>
                  <button
                    type="submit"
                    disabled={index === route.stops.length - 1}
                    aria-label="Bajar"
                    className="text-foreground/60 hover:text-foreground disabled:opacity-25"
                  >
                    ▼
                  </button>
                </form>
                <form action={removeRouteStop.bind(null, route.id, stop.id)}>
                  <button
                    type="submit"
                    className="text-foreground/50 hover:text-foreground text-xs underline"
                  >
                    Quitar
                  </button>
                </form>
              </li>
            ))}
          </ol>
        )}

        {availablePlaces.length > 0 && (
          <form action={addStop} className="flex items-center gap-2">
            <select
              name="placeId"
              required
              className="border-accent-soft focus:border-accent flex-1 rounded-full border bg-transparent px-3 py-2 text-sm outline-none dark:border-white/15"
            >
              {availablePlaces.map((place) => (
                <option key={place.id} value={place.id}>
                  {place.name}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="bg-accent text-accent-foreground rounded-full px-4 py-2 text-sm font-medium"
            >
              Agregar parada
            </button>
          </form>
        )}
      </section>

      <form action={deleteAndRedirect} className="self-start">
        <ConfirmSubmitButton
          label="Eliminar ruta"
          confirmMessage={`¿Eliminar "${route.translations.es.name}"? Esta acción no se puede deshacer.`}
        />
      </form>
    </div>
  );
}
