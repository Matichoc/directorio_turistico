"use client";

import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { routing } from "@/i18n/routing";
import { usePathname, useRouter } from "@/i18n/navigation";

const LANGUAGE_NAMES: Record<string, string> = {
  es: "Español",
  en: "English",
  pt: "Português",
};

/**
 * Botones ES · EN · PT, siempre visibles. Antes era un `<select>` con texto
 * blanco: la lista desplegable del sistema sale clara y las opciones no se
 * leían (feedback real del usuario). Va en `TopNav` (escritorio) y en
 * `MobileHeader` (celular), así se puede cambiar desde cualquier página.
 */
export function LocaleSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();

  return (
    <div
      role="group"
      aria-label={t("language")}
      className="inline-flex shrink-0 items-center rounded-full border border-white/15 bg-black/30 p-0.5"
    >
      {routing.locales.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            lang={code}
            title={LANGUAGE_NAMES[code]}
            aria-label={LANGUAGE_NAMES[code]}
            aria-pressed={active}
            onClick={() => {
              if (active) return;
              router.replace(
                // @ts-expect-error -- params shape depends on the active route
                { pathname, params },
                { locale: code },
              );
            }}
            className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-full px-3 text-xs font-semibold tracking-wide transition-colors ${
              active
                ? "bg-accent text-accent-foreground shadow-[0_0_12px_var(--accent-soft)]"
                : "text-foreground/70 hover:text-foreground"
            }`}
          >
            {code.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
