"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMyTeamRole } from "@/lib/data/team";
import { getSiteUrl } from "@/lib/seo";
import type { TeamRole } from "@/types/database";

/**
 * Manejo del equipo del panel (decisión del usuario: "varias personas, con
 * roles"). Todo con el cliente de servicio, pero solo después de confirmar
 * acá que quien lo pide es administrador: `admin_users` no tiene políticas
 * de escritura (supabase/manual/admin-roles.sql).
 *
 * Supabase Auth es compartido con el sitio de Papudo, así que:
 *   - las invitaciones NO salen por correo de Supabase (su link volvería a
 *     la URL del proyecto, que es la de Papudo): se arma un link propio a
 *     /admin/aceptar que quien invita manda por WhatsApp o correo;
 *   - quitar a alguien solo lo saca del equipo: nunca se borra su cuenta.
 */

const roleSchema = z.enum(["admin", "editor"]);

async function requireAdminRole() {
  const me = await getMyTeamRole();
  if (!me || me.role !== "admin") {
    throw new Error("Solo un administrador puede manejar el equipo.");
  }
  return me;
}

/** Link a /admin/aceptar con el código de un solo uso de Supabase. */
async function acceptLink(hashedToken: string, type: string) {
  const origin = (await headers()).get("origin") ?? getSiteUrl();
  const url = new URL("/admin/aceptar", origin);
  url.searchParams.set("token_hash", hashedToken);
  url.searchParams.set("type", type);
  return url.toString();
}

async function adminCount() {
  const { count } = await createAdminClient()
    .from("admin_users")
    .select("user_id", { count: "exact", head: true })
    .eq("role", "admin");
  return count ?? 0;
}

/**
 * Invita a una persona: crea su cuenta si no existe, la suma al equipo con
 * su rol y devuelve el link para que entre y cree su clave.
 */
export async function inviteMember(input: {
  email: string;
  role: TeamRole;
}): Promise<{ link: string }> {
  const me = await requireAdminRole();
  const email = z.email("Correo inválido").parse(input.email.trim());
  const role = roleSchema.parse(input.role);
  const admin = createAdminClient();

  let { data, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email,
  });
  // Ya tiene cuenta (por ejemplo, la usa en otro sitio): link para entrar.
  if (error && /registered|exists/i.test(error.message)) {
    ({ data, error } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email,
    }));
  }
  if (error || !data.user) {
    throw new Error(
      `No se pudo crear la invitación: ${error?.message ?? "sin usuario"}`,
    );
  }

  const { error: teamError } = await admin
    .from("admin_users")
    .upsert(
      { user_id: data.user.id, role, added_by: me.userId },
      { onConflict: "user_id" },
    );
  if (teamError) {
    throw new Error(`No se pudo sumar al equipo: ${teamError.message}`);
  }

  revalidatePath("/admin/personas");
  return {
    link: await acceptLink(
      data.properties.hashed_token,
      data.properties.verification_type,
    ),
  };
}

/** Link para que alguien del equipo cree una clave nueva (si la olvidó). */
export async function createPasswordLink(
  userId: string,
): Promise<{ link: string }> {
  await requireAdminRole();
  const admin = createAdminClient();
  const { data: found } = await admin.auth.admin.getUserById(
    z.uuid().parse(userId),
  );
  if (!found.user?.email) throw new Error("Esa cuenta no tiene correo.");

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email: found.user.email,
  });
  if (error) throw new Error(`No se pudo crear el link: ${error.message}`);
  return {
    link: await acceptLink(
      data.properties.hashed_token,
      data.properties.verification_type,
    ),
  };
}

export async function setMemberRole(
  userId: string,
  role: TeamRole,
): Promise<void> {
  const me = await requireAdminRole();
  const id = z.uuid().parse(userId);
  const nextRole = roleSchema.parse(role);
  if (id === me.userId && nextRole !== "admin" && (await adminCount()) <= 1) {
    throw new Error("Tiene que quedar al menos un administrador.");
  }
  const { error } = await createAdminClient()
    .from("admin_users")
    .update({ role: nextRole })
    .eq("user_id", id);
  if (error) throw new Error(`No se pudo cambiar el rol: ${error.message}`);
  revalidatePath("/admin/personas");
}

export async function removeMember(userId: string): Promise<void> {
  const me = await requireAdminRole();
  const id = z.uuid().parse(userId);
  if (id === me.userId) {
    throw new Error("No puedes quitarte a ti mismo del equipo.");
  }
  const { error } = await createAdminClient()
    .from("admin_users")
    .delete()
    .eq("user_id", id);
  if (error) throw new Error(`No se pudo quitar: ${error.message}`);
  revalidatePath("/admin/personas");
}
