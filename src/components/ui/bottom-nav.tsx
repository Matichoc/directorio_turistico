"use client";

import { useTranslations } from "next-intl";
import { usePathname, Link } from "@/i18n/navigation";
import { NAV_ITEMS, isNavActive } from "@/components/ui/nav-items";
import { MoreMenu } from "@/components/ui/more-menu";

/**
 * Nav al fondo, solo en celular (`sm:hidden`) — patrón de app móvil. Lo
 * fija la barra de abajo de `[locale]/layout.tsx`, junto con el auspicio.
 * En pantallas más anchas la reemplaza `TopNav` (ver ese archivo): una
 * barra fija al fondo de una ventana de escritorio muy alta pasa
 * desapercibida ("el botón para ver las secciones no está", feedback del
 * usuario), y no es el lugar donde alguien en desktop espera navegación.
 * El quinto botón es "Más" (Eventos, La leyenda, Información): con más de 5
 * botones la barra se aprieta.
 */
export function BottomNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("home")}
      className="bg-background/95 supports-[backdrop-filter]:bg-background/80 border-t border-black/10 backdrop-blur sm:hidden dark:border-white/10"
    >
      <ul className="mx-auto flex max-w-3xl items-stretch justify-between px-2">
        {NAV_ITEMS.map(({ href, key, Icon }) => {
          const active = isNavActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-1 py-2 text-xs font-medium ${
                  active
                    ? "text-accent [text-shadow:0_0_14px_var(--accent)]"
                    : "text-foreground/50 hover:text-foreground/80"
                }`}
              >
                <Icon className="h-5 w-5" />
                {t(key)}
              </Link>
            </li>
          );
        })}
        <li className="flex flex-1">
          <MoreMenu placement="bottom" />
        </li>
      </ul>
    </nav>
  );
}
