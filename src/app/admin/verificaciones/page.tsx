import Link from "next/link";
import { listPendingComments } from "@/lib/data/comments";
import {
  listAdminPlaces,
  listLatestPlaceVerifications,
  type AdminPlaceListItem,
} from "@/lib/data/places";
import { moderateComment } from "@/lib/server/content/comments";
import { submitPlaceVerificationForm } from "@/lib/server/content/verification";
import { PageHero } from "@/components/ui/page-hero";
import type { VerificationStatus } from "@/types/database";

const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  pending: "Pendiente",
  verified: "Verificado",
  outdated: "Desactualizado",
};

const VERIFICATION_STYLES: Record<VerificationStatus, string> = {
  pending:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  verified:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  outdated: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const dateFormatter = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

/** Lugares agrupados por comuna, en el orden alfabético de la comuna. */
function groupByCommune(places: AdminPlaceListItem[]) {
  const groups = new Map<string, AdminPlaceListItem[]>();
  for (const place of places) {
    const list = groups.get(place.communeName) ?? [];
    list.push(place);
    groups.set(place.communeName, list);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b, "es"));
}

/**
 * Verificación de datos por comuna (qué lugares ya revisó alguien y cuáles
 * no, con registro en `verification_logs`) + cola de moderación de
 * comentarios de lugares — pedido del usuario
 * ("dejar un comentario... para que se vayan ganando reputación"), con
 * aprobación previa del admin en vez de publicación inmediata (decisión
 * explícita, ver `docs/PLAN.md` sección 8 y `place_comments` en
 * `0015_place_comments.sql`). Único uso real hoy del nombre "Verificaciones"
 * de este panel (antes un placeholder puro).
 */
export default async function AdminVerificationsPage() {
  const [comments, allPlaces, latestLogs] = await Promise.all([
    listPendingComments(),
    listAdminPlaces(),
    listLatestPlaceVerifications(),
  ]);
  // Los desactivados no se ven en el sitio: no hay nada que verificar.
  const places = allPlaces.filter(
    (place) => place.publicationStatus !== "archived",
  );
  const groups = groupByCommune(places);
  const verifiedTotal = places.filter(
    (place) => place.verificationStatus === "verified",
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        title="Verificaciones"
        subtitle={`${verifiedTotal} de ${places.length} lugares verificados. Abajo, los comentarios pendientes de aprobar.`}
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Datos por comuna</h2>
        <p className="text-foreground/60 text-sm">
          Cada cambio queda registrado con quién y cuándo. Pensado para que cada
          municipio revise y valide sus propios lugares.
        </p>
        {groups.length === 0 ? (
          <p className="text-foreground/60 text-sm">Todavía no hay lugares.</p>
        ) : (
          groups.map(([commune, communePlaces]) => {
            const verified = communePlaces.filter(
              (place) => place.verificationStatus === "verified",
            ).length;
            return (
              <details
                key={commune}
                open={verified < communePlaces.length}
                className="surface-glass rounded-2xl"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-medium">
                  <span>{commune}</span>
                  <span className="text-foreground/60 text-xs font-normal">
                    {verified} de {communePlaces.length} verificados
                  </span>
                </summary>
                <ul className="flex flex-col gap-2 px-4 pb-4">
                  {communePlaces.map((place) => {
                    const log = latestLogs[place.id];
                    return (
                      <li
                        key={place.id}
                        className="flex flex-col gap-2 rounded-xl border border-black/10 p-3 text-sm dark:border-white/10"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <Link
                            href={`/admin/lugares/${place.id}`}
                            className="hover:text-accent truncate font-medium underline-offset-2 hover:underline"
                          >
                            {place.name}
                          </Link>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${VERIFICATION_STYLES[place.verificationStatus]}`}
                          >
                            {VERIFICATION_LABELS[place.verificationStatus]}
                          </span>
                        </div>
                        {log && (
                          <p className="text-foreground/50 text-xs">
                            Última revisión{" "}
                            {dateFormatter.format(new Date(log.verifiedAt))}
                            {log.notes ? ` — ${log.notes}` : ""}
                          </p>
                        )}
                        <form
                          action={submitPlaceVerificationForm}
                          className="flex flex-wrap items-center gap-2"
                        >
                          <input
                            type="hidden"
                            name="placeId"
                            value={place.id}
                          />
                          <input
                            name="notes"
                            placeholder="Nota (opcional): qué se confirmó o corrigió"
                            aria-label={`Nota de verificación de ${place.name}`}
                            className="border-accent-soft min-w-0 flex-1 rounded-full border bg-transparent px-3 py-1 text-xs outline-none dark:border-white/15"
                          />
                          <button
                            type="submit"
                            name="status"
                            value="verified"
                            className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                          >
                            Verificado
                          </button>
                          <button
                            type="submit"
                            name="status"
                            value="outdated"
                            className="rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                          >
                            Desactualizado
                          </button>
                        </form>
                      </li>
                    );
                  })}
                </ul>
              </details>
            );
          })
        )}
      </section>

      <h2 className="text-lg font-medium">Comentarios pendientes</h2>

      {comments.length === 0 ? (
        <p className="text-foreground/60 text-sm">
          No hay comentarios pendientes.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="rounded-xl border border-black/10 p-4 dark:border-white/10"
            >
              <p className="text-foreground/50 text-xs">{comment.placeName}</p>
              <p className="mt-1 text-sm">{comment.body}</p>
              <div className="mt-3 flex gap-2">
                <form
                  action={async () => {
                    "use server";
                    await moderateComment({
                      commentId: comment.id,
                      status: "approved",
                    });
                  }}
                >
                  <button
                    type="submit"
                    className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-700"
                  >
                    Aprobar
                  </button>
                </form>
                <form
                  action={async () => {
                    "use server";
                    await moderateComment({
                      commentId: comment.id,
                      status: "rejected",
                    });
                  }}
                >
                  <button
                    type="submit"
                    className="rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                  >
                    Rechazar
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
