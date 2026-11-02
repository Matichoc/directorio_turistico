import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CategoryIcon } from "@/components/ui/category-icon";
import { getCategoryIcon } from "@/lib/ui/category-gradient";

export interface CategoryTab {
  slug: string;
  name: string;
  count: number;
}

/**
 * Pestañas de categoría de Explorar (pedido del usuario: "ponerla por
 * categorías, como tenemos lo del Papudo"). "Todo", una por categoría con
 * su cantidad real de lugares (un lugar en varias categorías cuenta en
 * cada una) y un acceso a Rutas, que no es categoría. Cambiar de pestaña
 * conserva la vista (mapa/listado) y los demás filtros.
 */
export async function CategoryTabs({
  tabs,
  active,
  query,
}: {
  tabs: CategoryTab[];
  active: string | null;
  /** Filtros vigentes, sin `categoria`. */
  query: Record<string, string>;
}) {
  const t = await getTranslations("explore.categories");
  const pill =
    "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors";
  const on =
    "border-accent bg-accent text-accent-foreground shadow-[0_0_14px_var(--accent-soft)]";
  const off =
    "surface-glass text-foreground/75 hover:text-foreground border-white/10 hover:border-accent";

  return (
    <nav aria-label={t("label")} className="-mx-4 overflow-x-auto px-4">
      <ul className="flex gap-2 pb-1">
        <li>
          <Link
            href={{ pathname: "/explorar", query }}
            aria-current={active ? undefined : "page"}
            className={`${pill} ${active ? off : on}`}
          >
            {t("all")}
          </Link>
        </li>
        {tabs.map((tab) => {
          const isActive = tab.slug === active;
          return (
            <li key={tab.slug}>
              <Link
                href={{
                  pathname: "/explorar",
                  query: { ...query, categoria: tab.slug },
                }}
                aria-current={isActive ? "page" : undefined}
                className={`${pill} ${isActive ? on : off}`}
              >
                <CategoryIcon
                  icon={getCategoryIcon(tab.slug)}
                  className="h-4 w-4"
                />
                {tab.name}
                <span
                  className={`rounded-full px-1.5 text-xs ${isActive ? "bg-black/15" : "bg-white/10"}`}
                >
                  {tab.count}
                </span>
              </Link>
            </li>
          );
        })}
        <li>
          <Link href="/rutas" className={`${pill} ${off}`}>
            <CategoryIcon icon="tren" className="h-4 w-4" />
            {t("routes")} →
          </Link>
        </li>
        <li>
          <Link href="/leyenda" className={`${pill} ${off}`}>
            <CategoryIcon icon="diablo" className="h-4 w-4" />
            {t("legend")} →
          </Link>
        </li>
      </ul>
    </nav>
  );
}
