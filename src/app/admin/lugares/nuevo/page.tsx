import { PageHero } from "@/components/ui/page-hero";
import { PlaceForm } from "@/components/admin/place-form";
import { listCommunes } from "@/lib/data/communes";
import { listCategories } from "@/lib/data/categories";
import { listLocalityOptions } from "@/lib/data/localities";

export default async function NewAdminPlacePage() {
  const [communes, categories, localities] = await Promise.all([
    listCommunes("es"),
    listCategories("es"),
    listLocalityOptions(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        title="Nuevo lugar"
        subtitle="Completa los datos en ambos idiomas."
      />
      <PlaceForm
        communes={communes}
        categories={categories}
        localities={localities}
      />
    </div>
  );
}
