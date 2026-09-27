import { notFound, redirect } from "next/navigation";
import { PageHero } from "@/components/ui/page-hero";
import { PlaceForm } from "@/components/admin/place-form";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { getAdminPlaceById } from "@/lib/data/places";
import { listCommunes } from "@/lib/data/communes";
import { listCategories } from "@/lib/data/categories";
import { deletePlace } from "@/lib/server/content/places";

export default async function EditAdminPlacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [place, communes, categories] = await Promise.all([
    getAdminPlaceById(id),
    listCommunes("es"),
    listCategories("es"),
  ]);

  if (!place) {
    notFound();
  }

  const placeId = place.id;
  async function deleteAndRedirect() {
    "use server";
    await deletePlace(placeId);
    redirect("/admin/lugares");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        title={place.translations.es.name || place.slug}
        subtitle="Editar lugar."
      />
      <PlaceForm communes={communes} categories={categories} place={place} />

      <form action={deleteAndRedirect} className="self-start">
        <ConfirmSubmitButton
          label="Eliminar lugar"
          confirmMessage={`¿Eliminar "${place.translations.es.name}"? Esta acción no se puede deshacer.`}
        />
      </form>
    </div>
  );
}
