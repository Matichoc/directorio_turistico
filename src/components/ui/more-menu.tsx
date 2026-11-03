"use client";

import { useEffect, useId, useRef, useState } from "react";
import NextLink from "next/link";
import { useTranslations } from "next-intl";
import { usePathname, Link } from "@/i18n/navigation";
import {
  LockIcon,
  MORE_ITEMS,
  MoreIcon,
  isNavActive,
} from "@/components/ui/nav-items";

/**
 * ¿Hay una sesión del panel en este navegador? Solo mira si existe la cookie
 * de Supabase (`sb-…-auth-token`), sin bajar su cliente en cada página: es
 * para mostrar u ocultar un link, no un permiso — `/admin` sigue pidiendo
 * la clave y revisando el rol como siempre.
 */
function hasPanelSession(): boolean {
  return document.cookie
    .split(";")
    .some((cookie) => /^\s*sb-[^=]*-auth-token(\.\d+)?=/.test(cookie));
}

/**
 * Botón "Más" de las dos barras de navegación: abre las secciones que no
 * caben a la vista (`MORE_ITEMS`: Eventos, La leyenda, Información) y, solo
 * si hay una sesión del panel en este navegador, "Panel del equipo".
 * `placement="bottom"` (celular) abre hacia arriba; `"top"` (escritorio),
 * hacia abajo. Se cierra al elegir, al tocar afuera o con Escape. En la
 * barra de arriba, desde `md:`, no repite lo que ya está a la vista
 * (`inWideBar`).
 */
export function MoreMenu({ placement }: { placement: "bottom" | "top" }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const active = MORE_ITEMS.some(({ href }) => isNavActive(pathname, href));
  const bottom = placement === "bottom";

  return (
    <div ref={rootRef} className={bottom ? "relative flex-1" : "relative"}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={t("moreLabel")}
        onClick={() => {
          // Recién al abrir: la cookie no existe en el render del servidor.
          if (!open) setShowPanel(hasPanelSession());
          setOpen(!open);
        }}
        className={
          bottom
            ? `flex w-full flex-col items-center gap-1 py-2 text-xs font-medium ${
                active || open
                  ? "text-accent [text-shadow:0_0_14px_var(--accent)]"
                  : "text-foreground/50 hover:text-foreground/80"
              }`
            : `flex items-center gap-1.5 border-b-2 px-2 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                active
                  ? "border-accent text-accent [text-shadow:0_0_14px_var(--accent)]"
                  : "text-foreground/60 hover:text-foreground/80 border-transparent"
              }`
        }
      >
        <MoreIcon className={bottom ? "h-5 w-5" : "h-4 w-4"} />
        {t("more")}
        {!bottom && (
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path
              d="m6 9 6 6 6-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {open && (
        <ul
          id={menuId}
          className={`absolute z-50 flex w-60 flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#120c1c] p-1.5 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.9),0_0_24px_-6px_var(--accent-soft)] ${
            bottom ? "right-1 bottom-full mb-2" : "top-full right-0 mt-1"
          }`}
        >
          {MORE_ITEMS.map(({ href, key, Icon, inWideBar }) => {
            const itemActive = isNavActive(pathname, href);
            return (
              <li
                key={href}
                className={!bottom && inWideBar ? "md:hidden" : ""}
              >
                <Link
                  href={href}
                  aria-current={itemActive ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    itemActive
                      ? "bg-accent/15 text-accent"
                      : "text-foreground/85 hover:text-foreground hover:bg-white/5"
                  }`}
                >
                  <Icon className="text-accent h-5 w-5" />
                  {t(key)}
                </Link>
              </li>
            );
          })}
          {showPanel && (
            <li className="mt-1 border-t border-white/10 pt-1">
              {/* `/admin` no lleva idioma: el link de Next, no el de next-intl. */}
              <NextLink
                href="/admin"
                onClick={() => setOpen(false)}
                className="text-foreground/70 hover:text-foreground flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-white/5"
              >
                <LockIcon className="h-5 w-5" />
                {t("admin")}
              </NextLink>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
