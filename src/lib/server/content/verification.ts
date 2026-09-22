"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { EntityType, VerificationStatus } from "@/types/database";

const verifyEntitySchema = z.object({
  entityType: z.enum(["place", "route"]),
  entityId: z.uuid(),
  status: z.enum(["pending", "verified", "outdated"]),
  notes: z.string().max(2000).optional(),
});

export interface VerifyEntityInput {
  entityType: EntityType;
  entityId: string;
  status: VerificationStatus;
  notes?: string;
}

/**
 * Registra una verificación de contenido y actualiza el estado en la
 * entidad (`places`/`routes`). Requiere sesión de administrador: la
 * política RLS de `verification_logs`/`places`/`routes` rechaza el insert
 * si el usuario no está autenticado.
 */
export async function verifyEntity(input: VerifyEntityInput) {
  const parsed = verifyEntitySchema.parse(input);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error: logError } = await supabase.from("verification_logs").insert({
    entity_type: parsed.entityType,
    entity_id: parsed.entityId,
    status: parsed.status,
    notes: parsed.notes ?? null,
    verified_by: user?.id ?? null,
  });

  if (logError) {
    throw new Error(
      `No se pudo registrar la verificación: ${logError.message}`,
    );
  }

  const table = parsed.entityType === "place" ? "places" : "routes";
  const { error: updateError } = await supabase
    .from(table)
    .update({ verification_status: parsed.status })
    .eq("id", parsed.entityId);

  if (updateError) {
    throw new Error(
      `No se pudo actualizar el estado de verificación: ${updateError.message}`,
    );
  }
}
