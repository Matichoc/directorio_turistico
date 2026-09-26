"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CommentStatus } from "@/types/database";

const submitCommentSchema = z.object({
  placeId: z.uuid(),
  sessionId: z.string().min(1),
  body: z.string().trim().min(1).max(500),
});

export interface SubmitCommentInput {
  placeId: string;
  sessionId: string;
  body: string;
}

/**
 * Envía un comentario de un visitante anónimo — queda en `pending` hasta
 * que un administrador lo apruebe (ver `moderateComment` y
 * `/admin/verificaciones`). Nunca se publica solo: la política RLS de
 * `place_comments` (0015_place_comments.sql) rechaza cualquier intento de
 * insertarlo en un estado distinto a `pending`.
 */
export async function submitComment(input: SubmitCommentInput) {
  const parsed = submitCommentSchema.parse(input);
  const supabase = await createClient();

  const { error } = await supabase.from("place_comments").insert({
    place_id: parsed.placeId,
    session_id: parsed.sessionId,
    body: parsed.body,
  });

  if (error) {
    throw new Error(`No se pudo enviar el comentario: ${error.message}`);
  }
}

const moderateCommentSchema = z.object({
  commentId: z.uuid(),
  status: z.enum(["approved", "rejected"]),
});

export interface ModerateCommentInput {
  commentId: string;
  status: Extract<CommentStatus, "approved" | "rejected">;
}

/**
 * Aprueba o rechaza un comentario pendiente. Requiere sesión de
 * administrador: la política RLS de `place_comments` rechaza el update
 * si la cuenta no está en `admin_users` (`public.is_admin()`) — el mismo
 * chequeo que ahora también hace el middleware de `/admin`.
 */
export async function moderateComment(input: ModerateCommentInput) {
  const parsed = moderateCommentSchema.parse(input);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("place_comments")
    .update({
      status: parsed.status,
      moderated_at: new Date().toISOString(),
      moderated_by: user?.id ?? null,
    })
    .eq("id", parsed.commentId);

  if (error) {
    throw new Error(`No se pudo moderar el comentario: ${error.message}`);
  }

  revalidatePath("/admin/verificaciones");
}
