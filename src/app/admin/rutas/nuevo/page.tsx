import { PageHero } from "@/components/ui/page-hero";
import { RouteForm } from "@/components/admin/route-form";

export default function NewAdminRoutePage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHero
        title="Nueva ruta"
        subtitle="Guarda primero los datos generales; las paradas se agregan después de crearla."
      />
      <RouteForm />
    </div>
  );
}
