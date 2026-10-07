import { GameToken } from "@/components/ui/game-token";
import type { AvatarIcon } from "@/lib/navigation/avatar-storage";

/**
 * Tu posición real en vivo, dibujada como una ficha ("token" tipo
 * Monopoly, pedido del usuario) en vez del punto azul genérico de
 * MapLibre — reemplaza a `GeolocateControl` (`showUserLocation={false}`
 * en MapView) mientras dura la navegación.
 */
export function PlayerToken({ icon }: { icon: AvatarIcon }) {
  return (
    <span className="relative flex h-12 w-12 items-center justify-center">
      <span className="animate-glow-pulse bg-accent absolute h-12 w-12 rounded-full opacity-50 blur-sm" />
      <span className="animate-pin-pop relative">
        <GameToken icon={icon} metal="gold" />
      </span>
    </span>
  );
}
