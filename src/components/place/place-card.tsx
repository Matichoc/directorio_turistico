import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CategoryIcon } from "@/components/ui/category-icon";
import type { PlaceCard as PlaceCardType } from "@/types/domain";

export function PlaceCard({ place }: { place: PlaceCardType }) {
  const t = useTranslations("place");

  return (
    <Link
      href={{ pathname: "/lugares/[slug]", params: { slug: place.slug } }}
      className="border-accent-soft hover:border-accent group flex flex-col gap-2 rounded-2xl border bg-black/[.015] p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/[.03]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="bg-accent-soft text-accent flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
            <CategoryIcon icon={place.categorySlug} className="h-4 w-4" />
          </span>
          <h3 className="font-medium">{place.name}</h3>
        </div>
        {place.verificationStatus === "verified" ? (
          <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
            {t("verified")}
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            {t("verificationPending")}
          </span>
        )}
      </div>
      <p className="text-foreground/60 text-sm">
        {place.communeName}
        {place.categoryName ? ` · ${place.categoryName}` : ""}
      </p>
      {place.shortDescription && (
        <p className="text-foreground/70 line-clamp-2 text-sm">
          {place.shortDescription}
        </p>
      )}
    </Link>
  );
}
