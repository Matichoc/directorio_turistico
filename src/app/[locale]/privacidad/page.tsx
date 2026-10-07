import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { resolveLocale } from "@/i18n/utils";
import { PageHero } from "@/components/ui/page-hero";
import { buildPageMetadata, truncateDescription } from "@/lib/seo";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const SECTIONS = [
  "session",
  "comments",
  "analytics",
  "location",
  "thirdParties",
  "contact",
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = resolveLocale((await params).locale);
  const t = await getTranslations({ locale, namespace: "privacy" });
  return buildPageMetadata({
    locale,
    href: "/privacidad",
    title: t("title"),
    description: truncateDescription(t("intro")),
  });
}

/**
 * Aviso de privacidad. Describe solo lo que el sitio realmente hace (sesión
 * anónima de Supabase Auth, comentarios moderados, eventos anónimos en
 * `analytics_events`, ubicación opcional): si cambia algo de eso, cambia
 * acá también (y la fecha de "última actualización").
 */
export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations("privacy");

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-8">
      <PageHero title={t("title")} subtitle={t("intro")} scene="atardecer" />

      <div className="flex flex-col gap-5">
        {SECTIONS.map((key) => (
          <section key={key} className="flex flex-col gap-1">
            <h2 className="text-lg font-medium">
              {t(`sections.${key}.title`)}
            </h2>
            <p className="text-foreground/80 text-sm leading-relaxed">
              {t(`sections.${key}.body`)}
            </p>
          </section>
        ))}
        <p className="text-foreground/50 text-xs">{t("updated")}</p>
      </div>
    </main>
  );
}
