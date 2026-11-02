import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { SCENE_POSITION, SCENE_SRC } from "@/lib/ui/scene-backgrounds";

/**
 * Tarjeta ancha que lleva a `/leyenda`, con la escena del túnel. Va en el
 * inicio (después del vuelo 3D) y en Rutas (debajo de las rutas, que siguen
 * la huella del diablo): antes solo estaba en el inicio y la leyenda "quedaba
 * perdida" (feedback real del usuario).
 */
export async function LegendCard() {
  const t = await getTranslations("legend.home");

  return (
    <Link
      href="/leyenda"
      className="group hover:border-accent relative flex min-h-40 flex-col justify-end overflow-hidden rounded-2xl border border-white/10 p-5 text-white shadow-[0_8px_30px_-12px_rgba(0,0,0,0.8)] transition-all duration-300 hover:shadow-[0_0_28px_2px_var(--accent-soft)]"
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-cover transition-transform duration-700 ease-out group-hover:scale-105"
        style={{
          backgroundImage: `url(${SCENE_SRC.tunel})`,
          backgroundPosition: SCENE_POSITION.tunel,
        }}
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-[#07060c]/90 via-[#07060c]/60 to-transparent"
      />
      <span className="relative flex max-w-[65%] flex-col gap-1">
        <span className="font-display text-xl font-semibold">{t("title")}</span>
        <span className="text-sm text-white/80">{t("body")}</span>
        <span className="text-accent mt-1 text-sm font-semibold">
          {t("cta")} →
        </span>
      </span>
    </Link>
  );
}
