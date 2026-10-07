import { CategoryIcon } from "@/components/ui/category-icon";
import { ThemeAura } from "@/components/map/theme-aura";
import {
  getCategoryPinColor,
  getPlaceIcon,
  getPlaceTheme,
} from "@/lib/ui/category-gradient";

/**
 * Pin temático por categoría (forma de gota, ícono blanco al centro, halo
 * animado detrás según lo que ofrece el lugar — `ThemeAura`: ondas de playa,
 * dulces que suben, farol de historia, brasas del diablo) en vez del círculo
 * genérico anterior — a pedido del usuario, para que el mapa se vea vivo y
 * alusivo a cada lugar en vez de "plomo". `style.animationDelay` se pasa por
 * marcador para que no todos aparezcan/pulsen sincronizados.
 */
export function MapPin({
  categorySlug,
  placeIcon,
  selected = false,
  near = false,
  delayMs = 0,
  variant = "place",
}: {
  categorySlug?: string | null;
  placeIcon?: string | null;
  selected?: boolean;
  /** Estás a menos de `NEAR_STOP_KM` de esta parada (ver map-view.tsx):
   * la destaca con un halo dorado que pulsa más fuerte que el de siempre —
   * pedido del usuario, "que se destaque o brille al pasar por algún lugar". */
  near?: boolean;
  delayMs?: number;
  /** "locality" = pueblo: círculo neón con casita, distinto de la gota de
   * un atractivo, para que ambos se lean de un vistazo en el mismo mapa. */
  variant?: "place" | "locality";
}) {
  const color = getCategoryPinColor(categorySlug);
  const theme = getPlaceTheme(categorySlug, placeIcon);

  if (variant === "locality") {
    return (
      <span
        className="relative flex h-8 w-8 items-center justify-center"
        style={{ animationDelay: `${delayMs}ms` }}
      >
        <span
          className="bg-neon absolute h-7 w-7 animate-ping rounded-full opacity-30"
          style={{ animationDelay: `${delayMs}ms` }}
        />
        <span
          className={`animate-pin-pop bg-neon relative flex h-7 w-7 items-center justify-center rounded-full border-2 shadow-[0_0_14px_2px_var(--neon)] transition-transform duration-150 hover:scale-110 ${
            selected ? "scale-110 border-white" : "border-white/80"
          }`}
          style={{ animationDelay: `${delayMs}ms` }}
        >
          <CategoryIcon icon="pueblo" className="h-4 w-4 text-white" />
        </span>
      </span>
    );
  }

  return (
    <span
      className="relative flex h-9 w-9 items-center justify-center"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      {near && (
        <span
          className="absolute h-10 w-10 animate-ping rounded-full bg-amber-400 opacity-60"
          style={{ animationDuration: "1s" }}
        />
      )}
      <ThemeAura theme={theme} size={40} delayMs={delayMs} />
      <span
        className={`animate-pin-pop relative block h-8 w-8 -rotate-45 rounded-[50%_50%_50%_0] border-2 shadow-lg transition-transform duration-150 hover:scale-110 ${
          near
            ? "scale-125 border-amber-300 shadow-[0_0_16px_4px_rgba(251,191,36,0.75)]"
            : selected
              ? "scale-110 border-white"
              : "border-white"
        }`}
        style={{ backgroundColor: color, animationDelay: `${delayMs}ms` }}
      >
        <span className="flex h-full w-full rotate-45 items-center justify-center">
          <CategoryIcon
            icon={getPlaceIcon(categorySlug, placeIcon)}
            className={`h-4 w-4 text-white ${
              theme === "diablo" ? "motion-safe:animate-devil-peek" : ""
            }`}
          />
        </span>
      </span>
    </span>
  );
}
