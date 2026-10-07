import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { resolveLocale } from "@/i18n/utils";
import { TripView } from "@/components/trip/trip-view";
import { PageHero } from "@/components/ui/page-hero";
import type { Metadata } from "next";
import { buildPageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "trip" });
  return buildPageMetadata({
    locale,
    href: "/recorrido",
    title: t("title"),
    // Es el carrito personal de cada visitante: nada que indexar.
    noIndex: true,
  });
}

export default async function MyTripPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations("trip");

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-8">
      <PageHero title={t("title")} subtitle={t("subtitle")} scene="cerro" />

      <TripView locale={locale} />
    </main>
  );
}
