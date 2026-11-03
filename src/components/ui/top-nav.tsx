"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { usePathname, Link } from "@/i18n/navigation";
import { MORE_ITEMS, NAV_ITEMS, isNavActive } from "@/components/ui/nav-items";
import { MoreMenu } from "@/components/ui/more-menu";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";

/**
 * Nav horizontal fijo arriba, solo desde `sm:` hacia arriba (tablet/
 * escritorio) — ver `bottom-nav.tsx` para el equivalente en celular.
 * `sticky` (no `fixed`): participa del flujo normal, así que no hace
 * falta reservarle espacio a mano en el layout.
 * Desde `md:` los ítems de "Más" marcados `inWideBar` (Eventos) salen también
 * a la vista; el resto queda en "Más".
 */
export function TopNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav
      aria-label={t("home")}
      className="bg-background/95 supports-[backdrop-filter]:bg-background/80 sticky top-0 z-40 hidden border-b border-black/10 backdrop-blur sm:block dark:border-white/10"
    >
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-4">
        <Link href="/" aria-label={t("home")} className="shrink-0">
          <Image
            src="/icons/icon-192.png"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 drop-shadow-[0_0_8px_var(--accent-soft)]"
          />
        </Link>
        <ul className="flex flex-1 items-center justify-between">
          {[...NAV_ITEMS, ...MORE_ITEMS.filter((item) => item.inWideBar)].map(
            ({ href, key, Icon }) => {
              const active = isNavActive(pathname, href);
              const wideOnly = MORE_ITEMS.some((item) => item.href === href);
              return (
                <li key={href} className={wideOnly ? "hidden md:block" : ""}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-1.5 border-b-2 px-2 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                      active
                        ? "border-accent text-accent [text-shadow:0_0_14px_var(--accent)]"
                        : "text-foreground/60 hover:text-foreground/80 border-transparent"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {t(key)}
                  </Link>
                </li>
              );
            },
          )}
          <li>
            <MoreMenu placement="top" />
          </li>
        </ul>
        <LocaleSwitcher />
      </div>
    </nav>
  );
}
