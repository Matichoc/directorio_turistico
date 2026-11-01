import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { getOfficialRoute } from "@/lib/official-routes";

/**
 * Tarjeta "Ruta turística oficial" en la ficha de una ruta que corresponde a
 * una ruta real de la comuna (`lib/official-routes.ts`): su logo, de dónde
 * viene y su Instagram. Sin ruta oficial, no muestra nada.
 */
export async function OfficialRouteCard({ routeSlug }: { routeSlug: string }) {
  const official = getOfficialRoute(routeSlug);
  if (!official) return null;
  const t = await getTranslations("route.official");

  return (
    <aside className="surface-glass border-accent-soft flex items-center gap-4 rounded-2xl border p-4">
      <Image
        src={official.logo}
        alt={t("logoAlt")}
        width={88}
        height={88}
        className="h-20 w-20 shrink-0 rounded-full sm:h-22 sm:w-22"
      />
      <div className="flex flex-col gap-2">
        <p className="text-accent text-xs font-semibold tracking-wide uppercase">
          {t("badge")}
        </p>
        <p className="text-foreground/80 text-sm">{t("body")}</p>
        <a
          href={official.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-accent text-accent-foreground self-start rounded-full px-4 py-2 text-sm font-medium hover:shadow-[0_0_20px_2px_var(--accent-soft)]"
        >
          {t("instagram")}
        </a>
      </div>
    </aside>
  );
}
