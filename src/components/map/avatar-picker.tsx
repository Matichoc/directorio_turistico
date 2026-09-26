"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { CategoryIcon } from "@/components/ui/category-icon";
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
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-foreground/50 text-xs">{t("yourToken")}</span>
      {AVATAR_ICONS.map((icon) => (
        <button
          key={icon}
          type="button"
          onClick={() => setAvatarIcon(icon)}
          aria-label={icon}
          aria-pressed={selected === icon}
          className={`flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors ${
            selected === icon
              ? "border-accent bg-accent text-accent-foreground"
              : "border-accent-soft text-foreground/60 hover:border-accent dark:border-white/15"
          }`}
        >
          <CategoryIcon icon={icon} className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
