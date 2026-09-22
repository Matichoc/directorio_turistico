import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { resolveLocale } from "@/i18n/utils";
import { TripView } from "@/components/trip/trip-view";

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
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="text-foreground/60 text-sm">{t("subtitle")}</p>
      </header>

      <TripView locale={locale} />
    </main>
  );
}
