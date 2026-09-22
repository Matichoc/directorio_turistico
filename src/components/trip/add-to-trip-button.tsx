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
    function sync() {
      setAdded(isInTrip(placeId));
    }
    sync();
    window.addEventListener(TRIP_EVENT, sync);
    return () => window.removeEventListener(TRIP_EVENT, sync);
  }, [placeId]);

  return (
    <button
      type="button"
      aria-pressed={added}
      onClick={() => {
        if (added) {
          removeTripPlace(placeId);
        } else {
          addTripPlace(placeId);
          track({ name: "place_added_to_trip", properties: { placeId } });
        }
      }}
      className={`rounded-full px-4 py-2 text-sm font-medium ${
        added
          ? "border border-accent text-accent"
          : "bg-accent text-accent-foreground"
      }`}
    >
      {added ? t("removeFromTrip") : t("addToTrip")}
    </button>
  );
}
