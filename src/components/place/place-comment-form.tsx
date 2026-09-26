"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { submitComment } from "@/lib/server/content/comments";
import { getVisitorSessionId } from "@/lib/session/visitor-session";

const MAX_COMMENT_LENGTH = 500;

/**
 * Formulario para dejar un comentario de un lugar — pedido del usuario
 * ("para que se vayan ganando reputación"). Nunca se publica de
 * inmediato: queda pendiente de que un administrador lo apruebe en
 * `/admin/verificaciones` (decisión explícita del usuario, coherente con
 * "nunca contenido negativo" — ver `place_comments` en
 * `0015_place_comments.sql`), así que el mensaje de éxito lo deja claro
 * en vez de sugerir que ya quedó visible.
 */
export function PlaceCommentForm({ placeId }: { placeId: string }) {
  const t = useTranslations("place");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<"idle" | "pending" | "sent" | "error">(
    "idle",
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "pending") return;
    setStatus("pending");

    try {
      await submitComment({
        placeId,
        sessionId: getVisitorSessionId(),
        body,
      });
      setBody("");
      setStatus("sent");
    } catch (error) {
      console.error("[PlaceCommentForm] no se pudo enviar", error);
      setStatus("error");
    }
  }

  if (status === "sent") {
    return <p className="text-foreground/60 text-sm">{t("commentSent")}</p>;
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="flex flex-col gap-2"
    >
      <label className="flex flex-col gap-1 text-sm">
        {t("commentLabel")}
        <textarea
          required
          maxLength={MAX_COMMENT_LENGTH}
          rows={3}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className="border-accent-soft rounded-xl border bg-transparent px-3 py-2 text-sm dark:border-white/15"
        />
      </label>
      <p className="text-foreground/50 text-xs">{t("commentModerationNote")}</p>
      {status === "error" && (
        <p className="text-sm text-red-600">{t("commentError")}</p>
      )}
      <button
        type="submit"
        disabled={status === "pending" || body.trim().length === 0}
        className="bg-accent text-accent-foreground w-fit rounded-full px-4 py-2 text-sm font-medium disabled:opacity-60"
      >
        {status === "pending" ? t("commentSending") : t("commentSubmit")}
      </button>
    </form>
  );
}
