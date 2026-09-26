"use client";

import { useEffect, useState, type SVGProps } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { getLikeSessionId } from "@/lib/likes/session";
import {
  isPlaceLiked,
  markPlaceLiked,
  markPlaceUnliked,
} from "@/lib/likes/storage";
import { track } from "@/lib/analytics/track";

function HeartIcon({
  filled,
  ...props
}: SVGProps<SVGSVGElement> & { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      strokeWidth="1.75"
      {...props}
    >
      <path
        d="M12 20.5s-7.5-4.6-10-9.3C.4 7.8 2.3 4 6 4c2.2 0 3.7 1.2 4.8 2.6a.3.3 0 0 0 .4 0C12.3 5.2 13.8 4 16 4c3.7 0 5.6 3.8 4 7.2-2.5 4.7-10 9.3-10 9.3Z"
        stroke="currentColor"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * "Me gusta" por lugar — solo positivo, nunca reseña ni calificación
 * negativa (pedido explícito del usuario). Anónimo por sesión de
 * navegador (`getLikeSessionId`, ver migración `0014_place_likes.sql`):
 * no requiere login, aunque uno opcional (Google/Facebook) puede sumarse
 * después sin cambiar este mecanismo, ver docs/PLAN.md sección 8.1.
 *
 * El conteo se pide vía `place_like_counts()` (RPC, agregado — nunca la
 * tabla cruda) y el estado "¿ya le di me gusta?" se guarda localmente
 * (`lib/likes/storage.ts`) para no depender de una vuelta al servidor
 * solo para pintar el corazón.
 */
export function LikeButton({ placeId }: { placeId: string }) {
  const t = useTranslations("place");
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState<number | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    function syncLiked() {
      setLiked(isPlaceLiked(placeId));
    }
    syncLiked();

    let cancelled = false;
    async function loadCount() {
      const supabase = createClient();
      const { data } = await supabase.rpc("place_like_counts");
      if (cancelled || !data) return;
      const row = data.find((entry) => entry.place_id === placeId);
      setCount(row ? Number(row.likes_count) : 0);
    }
    void loadCount();
    return () => {
      cancelled = true;
    };
  }, [placeId]);

  function applyLiked(nextLiked: boolean) {
    if (nextLiked) {
      markPlaceLiked(placeId);
      setCount((current) => (current ?? 0) + 1);
    } else {
      markPlaceUnliked(placeId);
      setCount((current) => Math.max(0, (current ?? 1) - 1));
    }
    setLiked(nextLiked);
  }

  async function toggle() {
    if (pending) return;
    setPending(true);

    // Optimista: el corazón se marca al toque, antes de esperar la
    // respuesta de Supabase — si la escritura falla (tabla sin migrar
    // todavía, sin red, RLS mal configurado) se revierte en el catch, pero
    // nunca se queda "pegado" sin reaccionar al click.
    const wasLiked = liked;
    applyLiked(!wasLiked);

    const supabase = createClient();
    const sessionId = getLikeSessionId();

    try {
      if (wasLiked) {
        const { error } = await supabase
          .from("place_likes")
          .delete()
          .eq("place_id", placeId)
          .eq("session_id", sessionId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("place_likes")
          .insert({ place_id: placeId, session_id: sessionId });
        if (error) throw error;
        track({ name: "place_liked", properties: { placeId } });
      }
    } catch (error) {
      console.error('[LikeButton] no se pudo guardar el "me gusta"', error);
      applyLiked(wasLiked);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      aria-pressed={liked}
      disabled={pending}
      onClick={() => void toggle()}
      className={`flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
        liked
          ? "border-accent bg-accent-soft text-accent"
          : "border-black/10 dark:border-white/20"
      }`}
    >
      <HeartIcon filled={liked} className="h-4 w-4" />
      {liked ? t("liked") : t("like")}
      {count !== null && count > 0 && (
        <span className="text-foreground/50">· {count}</span>
      )}
    </button>
  );
}
