"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  addTripPlace,
  isInTrip,
  removeTripPlace,
  TRIP_EVENT,
} from "@/lib/trip/storage";
import { track } from "@/lib/analytics/track";

export function AddToTripButton({ placeId }: { placeId: string }) {
  const t = useTranslations("place");
  const [added, setAdded] = useState(false);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function sync() {
      const result = await isInTrip(placeId);
      if (!cancelled) setAdded(result);
    }
    void sync();
    window.addEventListener(TRIP_EVENT, sync);
    return () => {
      cancelled = true;
      window.removeEventListener(TRIP_EVENT, sync);
    };
  }, [placeId]);

  async function toggle() {
    if (pending) return;
    setPending(true);
    setFailed(false);
    try {
      if (added) {
        await removeTripPlace(placeId);
      } else {
        await addTripPlace(placeId);
        track({ name: "place_added_to_trip", properties: { placeId } });
      }
    } catch (error) {
      // Sin esto el botón parecía no hacer nada (bug real reportado por el
      // usuario: sin sesión de visitante, la escritura fallaba en silencio).
      console.error("[AddToTripButton] no se pudo guardar", error);
      setFailed(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        aria-pressed={added}
        disabled={pending}
        onClick={() => void toggle()}
        className={`rounded-full px-4 py-2 text-sm font-medium disabled:opacity-60 ${
          added
            ? "border-accent text-accent border"
            : "bg-accent text-accent-foreground"
        }`}
      >
        {added ? t("removeFromTrip") : t("addToTrip")}
      </button>
      {failed && (
        <p role="alert" className="text-xs text-amber-300">
          {t("tripError")}
        </p>
      )}
    </div>
  );
}
