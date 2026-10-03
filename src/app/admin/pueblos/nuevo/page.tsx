import { PageHero } from "@/components/ui/page-hero";
import { LocalityForm } from "@/components/admin/locality-form";
import { listCommunes } from "@/lib/data/communes";

export default async function NewAdminLocalityPage() {
  const communes = await listCommunes("es");

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        title="Nuevo pueblo"
        subtitle="Completa los datos en ambos idiomas."
      />
      <LocalityForm communes={communes} />
    </div>
  );
}
