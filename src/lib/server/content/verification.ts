"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const placeVerificationSchema = z.object({
  placeId: z.uuid(),
  status: z.enum(["pending", "verified", "outdated"]),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type PlaceVerificationInput = z.input<typeof placeVerificationSchema>;

/**
 * Marca un lugar como verificado / desactualizado / pendiente y deja el
 * rastro en `verification_logs` (quién, cuándo y con qué nota) — la tabla
 * existía desde la Fase 0 sin ningún flujo que la usara (docs/PLAN.md,
 * sección 9.2). Requiere sesión de administrador: la RLS de ambas tablas
 * rechaza el update/insert si la cuenta no está en `admin_users`.
 */
export async function setPlaceVerification(input: PlaceVerificationInput) {
  const parsed = placeVerificationSchema.parse(input);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("places")
    .update({ verification_status: parsed.status })
    .eq("id", parsed.placeId);

  if (error) {
    throw new Error(`No se pudo actualizar la verificación: ${error.message}`);
  }

  const { error: logError } = await supabase.from("verification_logs").insert({
    entity_type: "place",
    entity_id: parsed.placeId,
    status: parsed.status,
    notes: parsed.notes ? parsed.notes : null,
    verified_by: user?.id ?? null,
  });

  if (logError) {
    throw new Error(
      `No se pudo registrar la verificación: ${logError.message}`,
    );
  }

  revalidatePath("/admin/verificaciones");
  revalidatePath("/admin/lugares");
}

/** Variante para `<form action>` del panel: lee `placeId`, `status` y `notes`. */
export async function submitPlaceVerificationForm(formData: FormData) {
  await setPlaceVerification({
    placeId: String(formData.get("placeId") ?? ""),
    status: String(formData.get("status") ?? "") as "verified",
    notes: String(formData.get("notes") ?? ""),
  });
}
