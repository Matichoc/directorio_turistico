import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { BottomNav } from "@/components/ui/bottom-nav";
import { TopNav } from "@/components/ui/top-nav";
import { SponsorBanner } from "@/components/ui/sponsor-banner";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <NextIntlClientProvider>
      <div className="flex min-h-dvh flex-1 flex-col pb-16 sm:pb-0">
        <TopNav />
        {/* Mismo `max-w-3xl` que `TopNav`/`BottomNav`/`SponsorBanner`: sin
            esto, el contenido de cada página se estiraba a todo el ancho
            de la ventana en monitores anchos mientras el nav y el auspicio
            quedaban centrados — mapas y fotos se veían "gigantes o poco
            proporcionales" (feedback del usuario). */}
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
          {children}
        </div>
        <SponsorBanner />
      </div>
      <BottomNav />
    </NextIntlClientProvider>
  );
}
