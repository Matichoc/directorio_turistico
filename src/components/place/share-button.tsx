"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function ShareButton({
  title,
  url,
  label,
  className = "rounded-full border border-black/10 px-4 py-2 text-sm dark:border-white/20",
}: {
  title: string;
  /** Link a compartir; sin él, el de la página actual. */
  url?: string | (() => string);
  /** Texto del botón; sin él, "Compartir". */
  label?: string;
  className?: string;
}) {
  const t = useTranslations("place");
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const link =
      typeof url === "function" ? url() : (url ?? window.location.href);

    if (navigator.share) {
      try {
        await navigator.share({ title, url: link });
        return;
      } catch {
        // El usuario canceló el share nativo; seguimos al fallback.
      }
    }

    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permisos de portapapeles: no hay más fallback disponible.
    }
  }

  return (
    <button type="button" onClick={handleShare} className={className}>
      {copied ? t("linkCopied") : (label ?? t("share"))}
    </button>
  );
}
