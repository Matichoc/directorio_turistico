import { revalidatePath, updateTag } from "next/cache";
import { CONTENT_TAG } from "@/lib/data/cache";

/**
 * Después de guardar algo en el panel: borra el contenido público cacheado y
 * las páginas ya generadas, así el cambio se ve en la próxima visita (sin
 * esperar los 5 minutos de `CONTENT_REVALIDATE_SECONDS`). Solo se puede
 * llamar desde una Server Action (`updateTag`).
 */
export function refreshPublicContent() {
  updateTag(CONTENT_TAG);
  revalidatePath("/", "layout");
}
