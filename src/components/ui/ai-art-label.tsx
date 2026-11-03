import { useTranslations } from "next-intl";

/**
 * "Ilustración con IA": va sobre todo arte del diablo hecho con IA
 * (`isAiArt`, `lib/ui/scene-backgrounds.ts`) — pedido del usuario: que quede
 * evidencia mientras no haya fotos reales. Abajo a la derecha, donde las
 * fotos llevan su crédito (`PlacePhotoHero`); `className` lo mueve donde esa
 * esquina ya está ocupada. Discreto: no compite con el título.
 */
export function AiArtLabel({
  className = "right-2 bottom-2",
  short = false,
}: {
  className?: string;
  /** "IA" a secas, para imágenes chicas (miniatura de un evento). */
  short?: boolean;
}) {
  const t = useTranslations("common");
  return (
    <span
      className={`pointer-events-none absolute z-10 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium tracking-wide text-white/75 ${className}`}
    >
      {short ? t("aiArtShort") : t("aiArt")}
    </span>
  );
}
