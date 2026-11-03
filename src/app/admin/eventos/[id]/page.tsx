import { notFound, redirect } from "next/navigation";
import { PageHero } from "@/components/ui/page-hero";
import { EventForm } from "@/components/admin/event-form";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { getAdminEventById } from "@/lib/data/events";
import { listCommunes } from "@/lib/data/communes";
import { listLocalityOptions } from "@/lib/data/localities";
import { listAdminPlaces } from "@/lib/data/places";
import { deleteEvent } from "@/lib/server/content/events";

export default async function EditAdminEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [event, communes, localities, places] = await Promise.all([
    getAdminEventById(id),
    listCommunes("es"),
    listLocalityOptions(),
    listAdminPlaces(),
  ]);

  if (!event) {
    notFound();
  }

  const eventId = event.id;
  async function deleteAndRedirect() {
    "use server";
    await deleteEvent(eventId);
    redirect("/admin/eventos");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        title={event.translations.es.name || event.slug}
        subtitle="Editar evento. Para la próxima vez que se haga, cambia la fecha: la anterior no se guarda aparte."
      />
      <EventForm
        communes={communes}
        localities={localities}
        places={places.sort((a, b) => a.name.localeCompare(b.name, "es"))}
        event={event}
      />

      <form action={deleteAndRedirect} className="self-start">
        <ConfirmSubmitButton
          label="Eliminar evento"
          confirmMessage={`¿Eliminar "${event.translations.es.name}"? Esta acción no se puede deshacer.`}
        />
      </form>
    </div>
  );
}
