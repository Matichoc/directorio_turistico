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
    if (added) {
      await removeTripPlace(placeId);
    } else {
      await addTripPlace(placeId);
      track({ name: "place_added_to_trip", properties: { placeId } });
    }
  }

  return (
    <button
      type="button"
      aria-pressed={added}
      onClick={() => void toggle()}
      className={`rounded-full px-4 py-2 text-sm font-medium ${
        added
          ? "border-accent text-accent border"
          : "bg-accent text-accent-foreground"
      }`}
    >
      {added ? t("removeFromTrip") : t("addToTrip")}
    </button>
  );
}
