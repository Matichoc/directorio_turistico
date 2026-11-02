"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";

/**
 * Barra superior solo en celular (`sm:hidden`; desde `sm:` está `TopNav`):
 * logo, nombre del sitio y el cambio de idioma, para que este se vea en
 * todas las páginas y no solo en el inicio (feedback real del usuario).
 * No es fija: se va con el scroll y deja la pantalla al contenido.
 */
export function MobileHeader() {
  const t = useTranslations("home");

  return (
    <header className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 pt-3 sm:hidden">
      <Link href="/" className="flex min-w-0 items-center gap-2">
        <Image
          src="/icons/icon-192.png"
          alt=""
          width={28}
          height={28}
          className="h-7 w-7 shrink-0 drop-shadow-[0_0_8px_var(--accent-soft)]"
        />
        <span className="font-display line-clamp-2 text-xs leading-tight font-semibold tracking-wide">
          {t("title")}
        </span>
      </Link>
      <LocaleSwitcher />
    </header>
  );
}
