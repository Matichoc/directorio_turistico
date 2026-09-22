import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { LocaleSwitcher } from "@/components/ui/locale-switcher";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { resolveLocale } from "@/i18n/utils";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);

  return <Home />;
}

function Home() {
  const t = useTranslations("home");

  return (
    <main className="flex flex-1 flex-col gap-8 px-4 py-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <LocaleSwitcher />
      </header>
      <p className="text-foreground/70 max-w-prose">{t("subtitle")}</p>
      <input
        type="search"
        placeholder={t("searchPlaceholder")}
        className="w-full rounded-full border border-black/10 px-4 py-3 dark:border-white/20"
      />
      <section>
        <h2 className="mb-3 text-lg font-medium">{t("featuredRoutes")}</h2>
        <Link
          href="/rutas"
          className="inline-block rounded-lg border border-black/10 px-4 py-2 dark:border-white/20"
        >
          {t("featuredRoutes")} →
        </Link>
      </section>
    </main>
  );
}
