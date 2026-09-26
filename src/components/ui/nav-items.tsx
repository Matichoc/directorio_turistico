import type { SVGProps } from "react";

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

/**
 * Único lugar de verdad para los links de navegación principal (pedido de
 * diseño: un solo `Record`/lista, no duplicar a mano en cada componente
 * que necesite estos 5 links) — usado por `BottomNav` (celular) y `TopNav`
 * (escritorio, ver docs/PLAN.md: "el botón para ver las secciones no
 * está" en pantallas anchas, donde una barra fija al fondo de la ventana
 * pasa fácil desapercibida).
 */
export const NAV_ITEMS = [
  { href: "/", key: "home", Icon: HomeIcon },
  { href: "/explorar", key: "explore", Icon: CompassIcon },
  { href: "/rutas", key: "routes", Icon: RouteIcon },
  { href: "/recorrido", key: "myTrip", Icon: BackpackIcon },
  { href: "/informacion", key: "info", Icon: InfoIcon },
] as const;
