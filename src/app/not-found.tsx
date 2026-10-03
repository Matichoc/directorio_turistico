import Link from "next/link";

/**
 * 404 raíz con el mismo tema oscuro del sitio — el de Next por defecto
 * pinta fondo blanco y rompe el efecto de todo lo demás. Va fuera de
 * `[locale]` (sin proveedor de traducciones), así que el texto es fijo.
 */
export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <p className="text-gradient text-6xl font-semibold tracking-tight">404</p>
      <p className="text-foreground/70">
        Esta página no existe — el diablo ya se la llevó.
      </p>
      <Link
        href="/"
        className="surface-glass hover:border-accent rounded-full px-5 py-2 text-sm font-medium transition-all hover:shadow-[0_0_20px_2px_var(--accent-soft)]"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
