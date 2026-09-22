"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { EntityType } from "@/types/database";

const addSourceSchema = z.object({
  entityType: z.enum(["place", "route"]),
  entityId: z.uuid(),
  url: z.url(),
  label: z.string().max(200).optional(),
});

export interface AddSourceInput {
  entityType: EntityType;
  entityId: string;
  url: string;
  label?: string;
}

export async function addSource(input: AddSourceInput) {
  const parsed = addSourceSchema.parse(input);
  const supabase = await createClient();

  const { error } = await supabase.from("sources").insert({
    entity_type: parsed.entityType,
    entity_id: parsed.entityId,
    url: parsed.url,
    label: parsed.label ?? null,
  });

  if (error) {
    throw new Error(`No se pudo guardar la fuente: ${error.message}`);
  }
}
