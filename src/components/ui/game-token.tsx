import { CategoryIcon } from "@/components/ui/category-icon";

/**
 * Ficha del jugador como pieza de juego de mesa de metal (pedido del
 * usuario: "más realistas", tipo Monopoly): disco de peltre —u oro si está
 * elegida— con canto en relieve, una cara hundida y el ícono "grabado".
 * Fuente única para el selector (`AvatarPicker`) y para tu posición en el
 * mapa (`PlayerToken`); los colores viven en `globals.css` (`token-*`).
 */
export function GameToken({
  icon,
  metal = "pewter",
  size = "md",
}: {
  icon: string;
  metal?: "pewter" | "gold";
  size?: "sm" | "md";
}) {
  const outer = size === "sm" ? "h-10 w-10" : "h-11 w-11";
  const inner = size === "sm" ? "h-7 w-7" : "h-8 w-8";
  const glyph = size === "sm" ? "h-4 w-4" : "h-[18px] w-[18px]";
  return (
    <span
      className={`relative flex items-center justify-center rounded-full ${outer} ${
        metal === "gold" ? "token-gold" : "token-pewter"
      }`}
    >
      <span
        className={`token-face flex items-center justify-center rounded-full ${inner} ${
          metal === "gold" ? "text-[#4a2a06]" : "text-[#2a2e36]"
        }`}
      >
        <CategoryIcon
          icon={icon}
          strokeWidth={2.4}
          className={`token-engrave ${glyph}`}
        />
      </span>
      {/* Brillo especular: la luz que pega arriba a la izquierda. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full bg-[linear-gradient(135deg,rgba(255,255,255,0.55)_0%,rgba(255,255,255,0)_38%)]"
      />
    </span>
  );
}
