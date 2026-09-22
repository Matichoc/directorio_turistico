import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PhotoOrIcon } from "@/components/place/photo-or-icon";
import { CategoryBadge } from "@/components/place/category-badge";
import { getCategoryGradient } from "@/lib/ui/category-gradient";
import type { PlaceCard as PlaceCardType } from "@/types/domain";

export function PlaceCard({ place }: { place: PlaceCardType }) {
  const t = useTranslations("place");

  return (
    <Link
      href={{ pathname: "/lugares/[slug]", params: { slug: place.slug } }}
      className="border-accent-soft hover:border-accent group flex flex-col overflow-hidden rounded-2xl border bg-black/[.015] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/[.03]"
    >
      <div
        className={`relative flex aspect-[16/9] items-center justify-center overflow-hidden bg-gradient-to-br ${getCategoryGradient(place.categorySlug)}`}
      >
        <PhotoOrIcon
          photoUrl={place.photoUrl}
          alt={place.name}
          categorySlug={place.categorySlug}
          iconClassName="h-7 w-7 text-white/70"
          imgClassName="object-cover object-[center_65%]"
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
        <CategoryBadge
          categorySlug={place.categorySlug}
          categoryName={place.categoryName}
          className="absolute top-2 left-2"
        />
      </div>

      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium">{place.name}</h3>
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
      </div>
    </Link>
  );
}
