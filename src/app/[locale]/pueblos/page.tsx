import { redirect } from "@/i18n/navigation";
import { resolveLocale } from "@/i18n/utils";

/**
 * El listado de pueblos vive ahora dentro de `/explorar` (pedido del
 * usuario: "no tendría dos pantallas para lo mismo") — esta ruta queda solo
 * para que los links y marcadores viejos no den 404. La ficha de un pueblo
 * (`/pueblos/[slug]`) sigue existiendo.
 */
export default async function LocalitiesRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  redirect({ href: "/explorar", locale: resolveLocale(rawLocale) });
}
