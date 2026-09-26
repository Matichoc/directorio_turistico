import { listPendingComments } from "@/lib/data/comments";
import { moderateComment } from "@/lib/server/content/comments";

/**
 * Cola de moderación de comentarios de lugares — pedido del usuario
 * ("dejar un comentario... para que se vayan ganando reputación"), con
 * aprobación previa del admin en vez de publicación inmediata (decisión
 * explícita, ver `docs/PLAN.md` sección 8 y `place_comments` en
 * `0015_place_comments.sql`). Único uso real hoy del nombre "Verificaciones"
 * de este panel (antes un placeholder puro).
 */
export default async function AdminVerificationsPage() {
  const comments = await listPendingComments();

  return (
    <div>
      <h1 className="text-xl font-semibold">Verificaciones</h1>
      <p className="text-foreground/60 mt-2">
        Comentarios pendientes de aprobar antes de que se vean en la ficha del
        lugar.
      </p>

      {comments.length === 0 ? (
        <p className="text-foreground/60 mt-6 text-sm">
          No hay comentarios pendientes.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-4">
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
