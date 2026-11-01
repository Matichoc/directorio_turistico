import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { TeamRole } from "@/types/database";

export interface TeamMember {
  userId: string;
  email: string | null;
  role: TeamRole;
  createdAt: string;
  lastSignInAt: string | null;
}

export interface AuditEntry {
  id: number;
  at: string;
  who: string | null;
  tableName: string;
  action: "insert" | "update" | "delete";
  rowRef: string | null;
}

/** Quién está conectado y con qué rol (null = no es del equipo). */
export async function getMyTeamRole(): Promise<{
  userId: string;
  role: TeamRole;
} | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  // `*` y no `role`: antes de correr admin-roles.sql la columna no existe
  // y todos los que están son administradores.
  const { data } = await supabase
    .from("admin_users")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  return data ? { userId: user.id, role: data.role ?? "admin" } : null;
}

/** Correo de cada cuenta (las cuentas viven en Supabase Auth, compartido). */
async function emailsOf(userIds: string[]): Promise<Map<string, string>> {
  const admin = createAdminClient();
  const emails = new Map<string, string>();
  await Promise.all(
    [...new Set(userIds)].map(async (id) => {
      const { data } = await admin.auth.admin.getUserById(id);
      if (data.user?.email) emails.set(id, data.user.email);
    }),
  );
  return emails;
}

/** El equipo del panel, del más antiguo al más nuevo. Solo para admins. */
export async function listTeam(): Promise<TeamMember[]> {
  if (!isSupabaseConfigured()) return [];
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("admin_users")
    .select("*")
    .order("created_at");
  if (error || !data) return [];

  const users = new Map<string, { email?: string; last?: string | null }>();
  await Promise.all(
    data.map(async (row) => {
      const { data: found } = await admin.auth.admin.getUserById(row.user_id);
      users.set(row.user_id, {
        email: found.user?.email,
        last: found.user?.last_sign_in_at ?? null,
      });
    }),
  );

  return data.map((row) => ({
    userId: row.user_id,
    email: users.get(row.user_id)?.email ?? null,
    role: row.role ?? "admin",
    createdAt: row.created_at,
    lastSignInAt: users.get(row.user_id)?.last ?? null,
  }));
}

/** Últimos cambios hechos en el contenido (lo ve todo el equipo). */
export async function listAuditLog(limit = 200): Promise<AuditEntry[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_log")
    .select("id, at, user_id, table_name, action, row_ref")
    .order("at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];

  const emails = await emailsOf(
    data.flatMap((row) => (row.user_id ? [row.user_id] : [])),
  );
  return data.map((row) => ({
    id: row.id,
    at: row.at,
    who: row.user_id ? (emails.get(row.user_id) ?? row.user_id) : null,
    tableName: row.table_name,
    action: row.action,
    rowRef: row.row_ref,
  }));
}
