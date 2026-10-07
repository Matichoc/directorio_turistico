"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { GameToken } from "@/components/ui/game-token";
import {
  AVATAR_EVENT,
  AVATAR_ICONS,
  getAvatarIcon,
  setAvatarIcon,
  type AvatarIcon,
} from "@/lib/navigation/avatar-storage";

/**
 * Elegir la ficha ("token" tipo Monopoly) que te representa en el mapa de
 * navegación en vivo — pedido del usuario. Vive junto al botón de
 * "Iniciar navegación" (ver RouteNavigationMap) para elegirla antes de
 * salir a la ruta.
 */
export function AvatarPicker() {
  const t = useTranslations("route");
  const [selected, setSelected] = useState<AvatarIcon | null>(null);

  useEffect(() => {
    function sync() {
      setSelected(getAvatarIcon());
    }
    sync();
    window.addEventListener(AVATAR_EVENT, sync);
    return () => window.removeEventListener(AVATAR_EVENT, sync);
  }, []);

  if (!selected) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-foreground/50 text-xs">{t("yourToken")}</span>
      {AVATAR_ICONS.map((icon) => {
        const label = t(`avatarIcons.${icon}`);
        return (
          <button
            key={icon}
            type="button"
            onClick={() => setAvatarIcon(icon)}
            title={label}
            aria-label={label}
            aria-pressed={selected === icon}
            // La elegida se levanta del tablero y pasa a oro; las demás son
            // peltre y se levantan un poco al pasar el mouse.
            className={`rounded-full transition-transform duration-200 ${
              selected === icon
                ? "animate-check-pop -translate-y-1"
                : "opacity-80 hover:-translate-y-0.5 hover:opacity-100"
            }`}
          >
            <GameToken
              icon={icon}
              size="sm"
              metal={selected === icon ? "gold" : "pewter"}
            />
          </button>
        );
      })}
    </div>
  );
}
