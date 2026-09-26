import { CategoryIcon } from "@/components/ui/category-icon";
import type { AvatarIcon } from "@/lib/navigation/avatar-storage";

/**
 * Tu posición real en vivo, dibujada como una ficha ("token" tipo
 * Monopoly, pedido del usuario) en vez del punto azul genérico de
 * MapLibre — reemplaza a `GeolocateControl` (`showUserLocation={false}`
 * en MapView) mientras dura la navegación.
 */
export function PlayerToken({ icon }: { icon: AvatarIcon }) {
  return (
    <span className="relative flex h-11 w-11 items-center justify-center">
      <span className="animate-glow-pulse bg-accent absolute h-11 w-11 rounded-full opacity-50" />
      <span className="animate-pin-pop border-accent bg-foreground relative flex h-9 w-9 items-center justify-center rounded-full border-2 shadow-lg">
        <CategoryIcon icon={icon} className="text-background h-5 w-5" />
      </span>
    </span>
  );
}
