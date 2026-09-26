import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PhotoOrIcon } from "@/components/place/photo-or-icon";
import { CategoryBadge } from "@/components/place/category-badge";
import { FeaturedBadge } from "@/components/place/featured-badge";
import { getCategoryGradient } from "@/lib/ui/category-gradient";
import type { PlaceCard as PlaceCardType } from "@/types/domain";

/** Nombres fijos de las 4 tags del catálogo (ver scripts/seed.ts) — sin
 * traducción por locale todavía, igual que la tabla `tags` en la base. */
const TAG_LABELS: Record<string, string> = {
  familiar: "Familiar",
  "pet-friendly": "Pet friendly",
  accesible: "Accesible",
  leyenda: "Leyenda local",
};

export function PlaceCard({ place }: { place: PlaceCardType }) {
  const t = useTranslations("place");

  return (
    <Link
      href={{ pathname: "/lugares/[slug]", params: { slug: place.slug } }}
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-black/[.015] shadow-sm transition-all hover:-translate-y-0.5 dark:bg-white/[.03] ${
        place.isFeatured
          ? "border-amber-400 hover:shadow-[0_0_20px_2px_rgba(245,158,11,0.35)] dark:border-amber-500/70"
          : "border-accent-soft hover:border-accent hover:shadow-[0_0_20px_2px_var(--accent-soft)] dark:border-white/10"
      }`}
    >
      <div
        className={`relative flex aspect-[16/9] items-center justify-center overflow-hidden bg-gradient-to-br ${getCategoryGradient(place.categorySlug)}`}
      >
        <PhotoOrIcon
          photoUrl={place.photoUrl}
          alt={place.name}
          categorySlug={place.categorySlug}
          slug={place.slug}
          iconClassName="h-7 w-7 text-white/70"
          imgClassName="object-cover object-[center_65%]"
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
        <CategoryBadge
          categorySlug={place.categorySlug}
          categoryName={place.categoryName}
          className="absolute top-2 left-2"
        />
        {place.isFeatured && (
          <FeaturedBadge className="absolute top-2 right-2" />
        )}
        {place.photoCount > 1 && (
          <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3 w-3"
              aria-hidden="true"
            >
              <path d="M4 8h3l2-2h6l2 2h3v11H4z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
            {place.photoCount}
          </span>
        )}
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
        {place.tags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5">
            {place.tags.map((tag) => (
              <li
                key={tag}
                className="border-accent-soft text-foreground/70 rounded-full border px-2 py-0.5 text-[11px] dark:border-white/15"
              >
                {TAG_LABELS[tag] ?? tag}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Link>
  );
}
