import { PageHero } from "@/components/ui/page-hero";
import { ConfirmSubmitButton } from "@/components/admin/confirm-submit-button";
import { TagForm } from "@/components/admin/tag-form";
import { listCommunes } from "@/lib/data/communes";
import { listCategories } from "@/lib/data/categories";
import { listTags } from "@/lib/data/tags";
import { deleteTag } from "@/lib/server/content/tags";

/**
 * Comunas y categorías son catálogo geográfico/taxonómico estable: casi
 * todo el contenido del sitio referencia sus `id` (lugares, filtros de
 * `/explorar`, gradientes de `lib/ui/category-gradient.ts`), así que
 * editarlas o borrarlas a mano tiene mucho más radio de impacto que un
 * lugar o una ruta puntual — se muestran de solo lectura acá. Los tags sí
 * son aditivos y de bajo riesgo (agregar uno no rompe nada existente), por
 * eso son los únicos con alta/baja real en este primer corte del panel.
 */
export default async function AdminTaxonomyPage() {
  const [communes, categories, tags] = await Promise.all([
    listCommunes("es"),
    listCategories("es"),
    listTags(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHero
        title="Comunas y categorías"
        subtitle="Catálogo geográfico y de categorías (solo lectura) + tags de lugares."
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-foreground/50 text-sm font-medium">Comunas</h2>
        <ul className="flex flex-wrap gap-2">
          {communes.map((commune) => (
            <li
              key={commune.id}
              className="border-accent-soft rounded-full border px-3 py-1 text-xs dark:border-white/15"
            >
              {commune.name}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-foreground/50 text-sm font-medium">Categorías</h2>
        <ul className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <li
              key={category.id}
              className="border-accent-soft rounded-full border px-3 py-1 text-xs dark:border-white/15"
            >
              {category.name}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-foreground/50 text-sm font-medium">Tags</h2>
        {tags.length === 0 ? (
          <p className="text-foreground/60 text-sm">Todavía no hay tags.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li
                key={tag.id}
                className="border-accent-soft hover:border-accent flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-all hover:shadow-[0_0_20px_2px_var(--accent-soft)] dark:border-white/15"
              >
                {tag.name}
                <form action={deleteTag.bind(null, tag.id)}>
                  <ConfirmSubmitButton
                    label="✕"
                    confirmMessage={`¿Eliminar el tag "${tag.name}"?`}
                    className="text-foreground/50 hover:text-foreground"
                  />
                </form>
              </li>
            ))}
          </ul>
        )}
        <TagForm />
      </section>
    </div>
  );
}
