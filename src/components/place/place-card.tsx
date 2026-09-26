import { Link } from "@/i18n/navigation";
import { PhotoOrIcon } from "@/components/place/photo-or-icon";
import { getCategoryGradient } from "@/lib/ui/category-gradient";
import type { PlaceCard as PlaceCardType } from "@/types/domain";

/**
 * Ficha compacta, tipo ícono de carpeta (pedido del usuario en `/explorar`:
 * "un tamaño más pequeño de cuadrícula, parecido a recuadros de carpetas"):
 * miniatura cuadrada + nombre, sin descripción/tags/categoría en texto —
 * el color del gradiente y el ícono ya distinguen la categoría a simple
 * vista. La insignia de "pendiente de verificación" se saca del todo (es
 * el estado por defecto, ruido visual en una grilla chica); "verificado"
 * queda como un check discreto en vez del pill de texto de antes.
 */
export function PlaceCard({ place }: { place: PlaceCardType }) {
  return (
    <Link
      href={{ pathname: "/lugares/[slug]", params: { slug: place.slug } }}
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-black/[.015] shadow-sm transition-all hover:-translate-y-0.5 dark:bg-white/[.03] ${
        place.isFeatured
          ? "border-amber-400 hover:shadow-[0_0_20px_2px_rgba(245,158,11,0.35)] dark:border-amber-500/70"
          : "border-accent-soft hover:border-accent hover:shadow-[0_0_20px_2px_var(--accent-soft)] dark:border-white/10"
      }`}
    >
      <div
        className={`relative flex aspect-square items-center justify-center overflow-hidden bg-gradient-to-br ${getCategoryGradient(place.categorySlug)}`}
      >
        <PhotoOrIcon
          photoUrl={place.photoUrl}
          alt={place.name}
          categorySlug={place.categorySlug}
          icon={place.icon}
          iconClassName="h-6 w-6 text-white/70"
          imgClassName="object-cover object-[center_65%]"
          sizes="(min-width: 1024px) 16vw, (min-width: 640px) 25vw, 33vw"
        />
        {place.isFeatured && (
          <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[11px] text-white shadow">
            ★
          </span>
        )}
        {place.verificationStatus === "verified" && (
          <span
            title="Verificado"
            className="absolute bottom-1 left-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white shadow"
          >
            ✓
          </span>
        )}
      </div>

      <div className="flex flex-col gap-0.5 p-2">
        <h3 className="truncate text-xs font-medium">{place.name}</h3>
        <p className="text-foreground/50 truncate text-[11px]">
          {place.communeName}
        </p>
      </div>
    </Link>
  );
}
