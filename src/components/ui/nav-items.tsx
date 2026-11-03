import type { SVGProps } from "react";
import { CategoryIcon } from "@/components/ui/category-icon";

function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" {...props}>
      <path
        d="M4 11.5 12 4l8 7.5M6 10v9h12v-9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CompassIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" />
      <path
        d="m15 9-2 6-2-2-2 2 2-6 2 2 2-2z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RouteIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" {...props}>
      <circle cx="6" cy="6" r="2.5" stroke="currentColor" />
      <circle cx="18" cy="18" r="2.5" stroke="currentColor" />
      <path
        d="M8.5 6H15a3 3 0 0 1 3 3v0a3 3 0 0 1-3 3H9a3 3 0 0 0-3 3v0a3 3 0 0 0 3 3h6.5"
        stroke="currentColor"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BackpackIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" {...props}>
      <path
        d="M8 8V6a4 4 0 0 1 8 0v2M6 8h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Zm3 5h6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" />
      <path
        d="M12 11v5m0-8h.01"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return <CategoryIcon icon="calendario" className={props.className} />;
}

function DevilIcon(props: SVGProps<SVGSVGElement>) {
  return <CategoryIcon icon="diablo" className={props.className} />;
}

export function MoreIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" {...props}>
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.75" {...props}>
      <path
        d="M7 11V8a5 5 0 0 1 10 0v3M6 11h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Único lugar de verdad para los links de navegación (pedido de diseño: una
 * sola lista, no duplicar a mano en cada componente) — usado por `BottomNav`
 * (celular) y `TopNav` (escritorio, ver docs/PLAN.md: "el botón para ver las
 * secciones no está" en pantallas anchas).
 *
 * `NAV_ITEMS` van siempre a la vista. `MORE_ITEMS` van en "Más" (pedido del
 * usuario: la leyenda y los eventos "salen como más ocultos"): en celular no
 * caben más de 5 botones abajo. `inWideBar`: en escritorio ancho (`md:`) ese
 * ítem sale también a la vista en la barra de arriba.
 */
export const NAV_ITEMS = [
  { href: "/", key: "home", Icon: HomeIcon },
  { href: "/explorar", key: "explore", Icon: CompassIcon },
  { href: "/rutas", key: "routes", Icon: RouteIcon },
  { href: "/recorrido", key: "myTrip", Icon: BackpackIcon },
] as const;

export const MORE_ITEMS = [
  { href: "/eventos", key: "events", Icon: CalendarIcon, inWideBar: true },
  { href: "/leyenda", key: "legend", Icon: DevilIcon, inWideBar: false },
  { href: "/informacion", key: "info", Icon: InfoIcon, inWideBar: false },
] as const;

/** ¿Este link es la página actual (o una de sus fichas)? */
export function isNavActive(pathname: string, href: string): boolean {
  return pathname === href || (href !== "/" && pathname.startsWith(href));
}
