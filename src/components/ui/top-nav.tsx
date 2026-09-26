"use client";

import { useTranslations } from "next-intl";
import { usePathname, Link } from "@/i18n/navigation";
import { NAV_ITEMS } from "@/components/ui/nav-items";

/**
 * Nav horizontal fijo arriba, solo desde `sm:` hacia arriba (tablet/
 * escritorio) — ver `bottom-nav.tsx` para el equivalente en celular.
 * `sticky` (no `fixed`): participa del flujo normal, así que no hace
 * falta reservarle espacio a mano en el layout.
 */
export function TopNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("home")}
      className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 hidden border-b border-black/10 backdrop-blur sm:block dark:border-white/10"
    >
      <ul className="mx-auto flex max-w-3xl items-center justify-between px-4">
        {NAV_ITEMS.map(({ href, key, Icon }) => {
          const active =
            pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                  active
                    ? "border-accent text-accent"
                    : "text-foreground/60 hover:text-foreground/80 border-transparent"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t(key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
