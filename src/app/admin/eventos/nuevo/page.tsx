import { PageHero } from "@/components/ui/page-hero";
import { EventForm } from "@/components/admin/event-form";
import { listCommunes } from "@/lib/data/communes";
import { listLocalityOptions } from "@/lib/data/localities";
import { listAdminPlaces } from "@/lib/data/places";

export default async function NewAdminEventPage() {
  const [communes, localities, places] = await Promise.all([
    listCommunes("es"),
    listLocalityOptions(),
    listAdminPlaces(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        title="Nuevo evento"
        subtitle="Solo lo que esté confirmado: sin fecha segura, pon el mes."
      />
      <EventForm
        communes={communes}
        localities={localities}
        places={places.sort((a, b) => a.name.localeCompare(b.name, "es"))}
      />
    </div>
  );
}
