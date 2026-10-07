"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/lugares", label: "Lugares" },
  { href: "/admin/rutas", label: "Rutas" },
  { href: "/admin/pueblos", label: "Pueblos" },
  { href: "/admin/verificaciones", label: "Verificaciones" },
  { href: "/admin/metricas", label: "Métricas" },
  { href: "/admin/comunas-categorias", label: "Comunas y categorías" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // La barra de navegación no sirve de nada antes de loguearse (cualquier
  // link ahí rebota a este mismo login vía middleware) — mostrarla igual
  // solo confunde, como si el panel ya estuviera "abierto" sin estarlo.
  if (pathname === "/admin/login") {
    return <main className="flex min-h-dvh flex-col p-6">{children}</main>;
  }

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="border-b border-black/10 p-4 md:w-56 md:border-r md:border-b-0 dark:border-white/10">
        <p className="text-accent mb-4 text-sm font-semibold tracking-wide uppercase">
          El Diablo en Petorca — Admin
        </p>
        <nav>
          <ul className="flex flex-row gap-2 overflow-x-auto md:flex-col">
            {sections.map((section) => {
              const active =
                pathname === section.href ||
                (section.href !== "/admin" &&
                  pathname?.startsWith(section.href));
              return (
                <li key={section.href}>
                  <Link
                    href={section.href}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                      active
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground/60 hover:bg-accent-soft/40 hover:text-foreground"
                    }`}
                  >
                    {section.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
