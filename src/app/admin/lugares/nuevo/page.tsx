import { PageHero } from "@/components/ui/page-hero";
import { PlaceForm } from "@/components/admin/place-form";
import { listCommunes } from "@/lib/data/communes";
import { listCategories } from "@/lib/data/categories";

export default async function NewAdminPlacePage() {
  const [communes, categories] = await Promise.all([
    listCommunes("es"),
    listCategories("es"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        title="Nuevo lugar"
        subtitle="Completa los datos en ambos idiomas."
      />
      <PlaceForm communes={communes} categories={categories} />
    </div>
  );
}
