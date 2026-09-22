import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPlaceBySlug } from "@/lib/data/places";
import { resolveLocale } from "@/i18n/utils";

export default async function PlaceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale: rawLocale, slug } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);
  const t = await getTranslations("place");

  const place = await getPlaceBySlug(slug, locale);
  if (!place) {
    notFound();
  }

  return (
    <main className="flex flex-1 flex-col gap-4 px-4 py-8">
      <h1 className="text-2xl font-semibold">{place.name}</h1>
      {place.verificationStatus !== "verified" && (
        <span className="w-fit rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
          {t("verificationPending")}
        </span>
      )}
      <p className="text-foreground/70">{place.description}</p>
    </main>
  );
}
