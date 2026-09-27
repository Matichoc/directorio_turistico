"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const tagFormSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "El slug debe ser minúsculas, números y guiones (ej: pet-friendly)",
    ),
  name: z.string().trim().min(1, "Falta el nombre"),
});

export type TagFormInput = z.input<typeof tagFormSchema>;

/**
 * Alta de un tag nuevo (catálogo aditivo y de bajo riesgo: a diferencia de
 * comunas/categorías, ningún lugar existente depende de que este tag
 * exista, así que agregarlo no puede romper nada — ver nota de alcance en
 * `/admin/comunas-categorias`).
 */
export async function createTag(input: TagFormInput): Promise<void> {
  const parsed = tagFormSchema.parse(input);
  const supabase = await createClient();

  const { error } = await supabase.from("tags").insert({
    slug: parsed.slug,
    name: parsed.name,
  });

  if (error) {
    throw new Error(`No se pudo crear el tag: ${error.message}`);
  }

  revalidatePath("/admin/comunas-categorias");
}

export async function deleteTag(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("tags").delete().eq("id", id);

  if (error) {
    throw new Error(
      `No se pudo eliminar el tag (¿está asignado a algún lugar?): ${error.message}`,
    );
  }

  revalidatePath("/admin/comunas-categorias");
}
