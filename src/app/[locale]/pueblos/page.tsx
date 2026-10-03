import { getTranslations, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { resolveLocale } from "@/i18n/utils";
import { Link } from "@/i18n/navigation";
import { PageHero } from "@/components/ui/page-hero";
import { EmptyState } from "@/components/ui/empty-state";
import { listLocalities } from "@/lib/data/localities";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocalitiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations("locality");

  const localities = await listLocalities(locale);

  const byCommune = new Map<string, typeof localities>();
  for (const locality of localities) {
    const group = byCommune.get(locality.communeName) ?? [];
    group.push(locality);
    byCommune.set(locality.communeName, group);
  }

  return (
    <main className="flex flex-1 flex-col gap-6 px-4 py-8">
      <PageHero title={t("title")} subtitle={t("subtitle")} />

      {localities.length === 0 ? (
        <EmptyState>{t("noResults")}</EmptyState>
      ) : (
        Array.from(byCommune.entries()).map(([communeName, group]) => (
          <section key={communeName} className="flex flex-col gap-3">
            <h2 className="text-foreground/50 text-sm font-medium">
              {communeName}
            </h2>
            <ul className="flex flex-wrap gap-2">
              {group.map((locality) => (
                <li key={locality.id}>
                  <Link
                    href={{
                      pathname: "/pueblos/[slug]",
                      params: { slug: locality.slug },
                    }}
                    className="border-accent-soft hover:border-accent block rounded-full border px-4 py-2 text-sm font-medium transition-all hover:shadow-[0_0_20px_2px_var(--accent-soft)] dark:border-white/10"
                  >
                    {locality.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </main>
  );
}
