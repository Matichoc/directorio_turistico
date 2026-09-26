import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { resolveLocale } from "@/i18n/utils";
import { PageHero } from "@/components/ui/page-hero";

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
  const info = await getTranslations("info");

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-8">
      <PageHero title={t("info")} subtitle={info("about")} />

      <section className="flex flex-col gap-1">
        <h2 className="text-foreground/50 text-sm font-medium">
          {info("developmentTitle")}
        </h2>
        <p className="text-foreground/80 text-sm">
          {info("developmentCredit")}
        </p>
      </section>

      <p className="text-foreground/60 text-sm">{info("sponsorNote")}</p>
    </main>
  );
}
