import { PageHero } from "@/components/ui/page-hero";
import { TeamManager } from "@/components/admin/team-manager";
import { getMyTeamRole, listTeam } from "@/lib/data/team";

export const dynamic = "force-dynamic";

/**
 * Personas del panel y sus roles. Administrador: todo, incluido esto.
 * Editor: el contenido (lugares, rutas, pueblos, comentarios…).
 */
export default async function TeamPage() {
  const me = await getMyTeamRole();

  if (!me || me.role !== "admin") {
    return (
      <div className="flex flex-col gap-4">
        <PageHero title="Personas" />
        <p className="text-foreground/70 text-sm">
          Solo los administradores ven y manejan el equipo. Si necesitas sumar a
          alguien, pídeselo a un administrador.
        </p>
      </div>
    );
  }

  const members = await listTeam();

  return (
    <div className="flex flex-col gap-4">
      <PageHero
        title="Personas"
        subtitle="Invita a quien vaya a ayudar con el directorio. Administrador: todo, incluido el equipo. Editor: lugares, rutas, pueblos y comentarios."
      />
      <TeamManager members={members} myUserId={me.userId} />
    </div>
  );
}
