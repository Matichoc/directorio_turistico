import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { BottomNav } from "@/components/ui/bottom-nav";
import { TopNav } from "@/components/ui/top-nav";
import { HtmlShell } from "@/components/ui/html-shell";
import { MobileHeader } from "@/components/ui/mobile-header";
import { SponsorBanner } from "@/components/ui/sponsor-banner";
import { DevEnvironmentBanner } from "@/components/ui/dev-environment-banner";
import { ServiceWorkerRegister } from "@/components/offline/service-worker-register";
import { listActiveSponsors } from "@/lib/data/sponsors";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Las páginas públicas se generan una vez y se sirven desde la caché de
 * Vercel, regenerándose cada 5 minutos o al guardar en el panel
 * (`refreshPublicContent`). Antes se armaban de cero en cada visita: de 0,5 a
 * 3 s de espera (docs/RENDIMIENTO.md). Las que leen `searchParams`
 * (Explorar) siguen siendo dinámicas, pero sus datos salen de la caché.
 */
export const revalidate = 300;

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

  const sponsors = await listActiveSponsors(locale);

  return (
    <HtmlShell lang={locale}>
      <NextIntlClientProvider>
        <div className="flex min-h-dvh flex-1 flex-col pb-16 sm:pb-0">
          <DevEnvironmentBanner />
          <ServiceWorkerRegister />
          <TopNav />
          <MobileHeader />
          {/* Mismo `max-w-3xl` que `TopNav`/`BottomNav`/`SponsorBanner`: sin
            esto, el contenido de cada página se estiraba a todo el ancho
            de la ventana en monitores anchos mientras el nav y el auspicio
            quedaban centrados — mapas y fotos se veían "gigantes o poco
            proporcionales" (feedback del usuario). */}
          <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col">
            {children}
          </div>
          <SponsorBanner sponsors={sponsors} />
        </div>
        <BottomNav />
      </NextIntlClientProvider>
    </HtmlShell>
  );
}
