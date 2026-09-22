"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("common");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-8 text-center">
      <p className="text-foreground/70">{t("error")}</p>
      <button
        type="button"
        onClick={reset}
        className="bg-foreground text-background rounded-full px-4 py-2 text-sm"
      >
        {t("retry")}
      </button>
    </main>
  );
}
