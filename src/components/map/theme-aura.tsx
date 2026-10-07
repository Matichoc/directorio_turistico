import type { CSSProperties } from "react";
import { THEME_STYLE, type PlaceTheme } from "@/lib/ui/category-gradient";

/**
 * La animación de "lo que ofrece" un lugar o sector en el mapa (ver
 * docs/DESIGN.md, "Mapa de /explorar"): ondas de playa, dulces y sabores que
 * suben, farol que titila en la historia, brasas en los lugares del diablo y
 * un halo que respira en la naturaleza. Decorativa (`aria-hidden`), detrás del
 * pin; con movimiento reducido queda quieta (`motion-safe:`).
 *
 * Se centra en su contenedor (`relative`) — `size` es el diámetro del halo.
 */
export function ThemeAura({
  theme,
  size = 36,
  delayMs = 0,
}: {
  theme: PlaceTheme;
  size?: number;
  delayMs?: number;
}) {
  const { color } = THEME_STYLE[theme];
  const box: CSSProperties = {
    width: size,
    height: size,
    left: "50%",
    top: "50%",
    marginLeft: -size / 2,
    marginTop: -size / 2,
  };
  const delay = (extra: number) => ({ animationDelay: `${delayMs + extra}ms` });

  if (theme === "playa") {
    return (
      <span
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={box}
      >
        {[0, 1200].map((offset) => (
          <span
            key={offset}
            className="motion-safe:animate-aura-ripple absolute inset-0 rounded-[50%] border-2 opacity-50"
            style={{ borderColor: color, ...delay(offset) }}
          />
        ))}
      </span>
    );
  }

  if (theme === "dulces" || theme === "sabores") {
    // Dulces: confites de colores; sabores: vapor del color de la cocina.
    const dots =
      theme === "dulces"
        ? ["#f472b6", "#fbbf24", "#a78bfa"]
        : [color, "#fdba74", color];
    return (
      <span
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={box}
      >
        {dots.map((dotColor, index) => (
          <span
            key={index}
            className="motion-safe:animate-aura-rise absolute top-0 h-1.5 w-1.5 rounded-full opacity-0 motion-reduce:opacity-70"
            style={{
              backgroundColor: dotColor,
              left: `${25 + index * 25}%`,
              boxShadow: `0 0 6px ${dotColor}`,
              ...delay(index * 700),
            }}
          />
        ))}
      </span>
    );
  }

  if (theme === "diablo") {
    return (
      <span
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={box}
      >
        <span
          className="motion-safe:animate-aura-flicker absolute inset-0 rounded-full opacity-60 blur-[3px]"
          style={{
            background: `radial-gradient(circle, ${color} 0%, rgba(249,115,22,0.5) 45%, transparent 70%)`,
            ...delay(0),
          }}
        />
        {[0, 600, 1200].map((offset, index) => (
          <span
            key={offset}
            className="motion-safe:animate-aura-ember absolute top-1 h-1 w-1 rounded-full bg-orange-400 opacity-0 shadow-[0_0_6px_#fb923c]"
            style={{ left: `${30 + index * 20}%`, ...delay(offset) }}
          />
        ))}
      </span>
    );
  }

  // Historia: farol que titila; naturaleza: halo que respira.
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute rounded-full opacity-50 blur-[2px] ${
        theme === "historia"
          ? "motion-safe:animate-aura-flicker"
          : "motion-safe:animate-glow-pulse"
      }`}
      style={{
        ...box,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        ...delay(0),
      }}
    />
  );
}
