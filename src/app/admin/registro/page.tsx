import { PageHero } from "@/components/ui/page-hero";
import { listAuditLog, type AuditEntry } from "@/lib/data/team";

export const dynamic = "force-dynamic";

/** Nombre entendible de cada tabla registrada (admin-roles.sql). */
const WHAT: Record<string, string> = {
  places: "Lugar",
  place_translations: "Texto de lugar",
  place_images: "Foto de lugar",
  place_tags: "Característica de lugar",
  place_secondary_categories: "Categoría de lugar",
  place_comments: "Comentario",
  routes: "Ruta",
  route_translations: "Texto de ruta",
  route_stops: "Parada de ruta",
  localities: "Pueblo",
  locality_translations: "Texto de pueblo",
  communes: "Comuna",
  commune_translations: "Texto de comuna",
  categories: "Categoría",
  category_translations: "Nombre de categoría",
  sponsors: "Auspiciador",
  sponsor_translations: "Texto de auspiciador",
  contact_links: "Enlace de municipalidad",
  sources: "Fuente",
  admin_users: "Equipo",
};

const ACTION: Record<AuditEntry["action"], string> = {
  insert: "Creó",
  update: "Editó",
  delete: "Borró",
};

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Registro de cambios: quién cambió qué y cuándo (los últimos 200). Lo
 * llena un disparador en la base; nadie lo puede editar ni borrar.
 */
export default async function AuditLogPage() {
  const entries = await listAuditLog();

  return (
    <div className="flex flex-col gap-4">
      <PageHero
        title="Registro de cambios"
        subtitle="Quién cambió qué y cuándo en el contenido. «Sistema» son cargas hechas por scripts o directo en la base."
      />
      {entries.length === 0 ? (
        <p className="text-foreground/60 text-sm">
          Todavía no hay cambios registrados (o falta correr
          supabase/manual/admin-roles.sql).
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-foreground/50 text-xs">
              <tr>
                <th className="py-2 pr-3 font-medium">Cuándo</th>
                <th className="py-2 pr-3 font-medium">Quién</th>
                <th className="py-2 pr-3 font-medium">Qué</th>
                <th className="py-2 font-medium">Cuál</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-t border-white/10">
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {dateFormatter.format(new Date(entry.at))}
                  </td>
                  <td className="py-2 pr-3">{entry.who ?? "Sistema"}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">
                    {ACTION[entry.action]}{" "}
                    {(WHAT[entry.tableName] ?? entry.tableName).toLowerCase()}
                  </td>
                  <td className="text-foreground/70 max-w-xs truncate py-2">
                    {entry.rowRef ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
