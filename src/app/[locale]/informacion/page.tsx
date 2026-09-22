import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { resolveLocale } from "@/i18n/utils";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function InfoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations("nav");

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-8">
      <h1 className="text-2xl font-semibold">{t("info")}</h1>
    </main>
  );
}
