import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { PlaceCard as PlaceCardType } from "@/types/domain";

export function PlaceCard({ place }: { place: PlaceCardType }) {
  const t = useTranslations("place");

  return (
    <Link
      href={{ pathname: "/lugares/[slug]", params: { slug: place.slug } }}
      className="flex flex-col gap-2 rounded-xl border border-black/10 p-4 transition-colors hover:border-black/30 dark:border-white/10 dark:hover:border-white/30"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium">{place.name}</h3>
        {place.verificationStatus !== "verified" && (
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
