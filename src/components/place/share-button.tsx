"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function ShareButton({ title }: { title: string }) {
  const t = useTranslations("place");
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // El usuario canceló el share nativo; seguimos al fallback.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Sin permisos de portapapeles: no hay más fallback disponible.
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="rounded-full border border-black/10 px-4 py-2 text-sm dark:border-white/20"
    >
      {copied ? t("linkCopied") : t("share")}
    </button>
  );
}
