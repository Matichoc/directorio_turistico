import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { resolveLocale } from "@/i18n/utils";
import { TripView } from "@/components/trip/trip-view";
import { PageHero } from "@/components/ui/page-hero";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
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
      <PageHero title={t("title")} subtitle={t("subtitle")} />

      <TripView locale={locale} />
    </main>
  );
}
