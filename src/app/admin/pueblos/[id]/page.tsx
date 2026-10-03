import { notFound, redirect } from "next/navigation";
import { PageHero } from "@/components/ui/page-hero";
import { LocalityForm } from "@/components/admin/locality-form";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { getAdminLocalityById } from "@/lib/data/localities";
import { listCommunes } from "@/lib/data/communes";
import { deleteLocality } from "@/lib/server/content/localities";

export default async function EditAdminLocalityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [locality, communes] = await Promise.all([
    getAdminLocalityById(id),
    listCommunes("es"),
  ]);

  if (!locality) {
    notFound();
  }

  const localityId = locality.id;
  async function deleteAndRedirect() {
    "use server";
    await deleteLocality(localityId);
    redirect("/admin/pueblos");
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        title={locality.translations.es.name || locality.slug}
        subtitle="Editar pueblo."
      />
      <LocalityForm communes={communes} locality={locality} />

      <form action={deleteAndRedirect} className="self-start">
        <ConfirmSubmitButton
          label="Eliminar pueblo"
          confirmMessage={`¿Eliminar "${locality.translations.es.name}"? Los lugares que lo tengan asignado solo perderán esa referencia, no se borran. Esta acción no se puede deshacer.`}
        />
      </form>
    </div>
  );
}
