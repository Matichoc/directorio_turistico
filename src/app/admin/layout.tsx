import type { ReactNode } from "react";
import Link from "next/link";

const sections = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/lugares", label: "Lugares" },
  { href: "/admin/rutas", label: "Rutas" },
  { href: "/admin/verificaciones", label: "Verificaciones" },
  { href: "/admin/comunas-categorias", label: "Comunas y categorías" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="border-b border-black/10 p-4 md:w-56 md:border-r md:border-b-0 dark:border-white/10">
        <p className="text-foreground/50 mb-4 text-sm font-semibold tracking-wide uppercase">
          El Diablo en Petorca — Admin
        </p>
        <nav>
          <ul className="flex flex-row gap-2 overflow-x-auto md:flex-col">
            {sections.map((section) => (
              <li key={section.href}>
                <Link
                  href={section.href}
                  className="block rounded px-2 py-1.5 text-sm whitespace-nowrap hover:bg-black/5 dark:hover:bg-white/10"
                >
                  {section.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
