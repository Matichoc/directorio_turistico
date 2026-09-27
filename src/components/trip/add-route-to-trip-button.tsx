"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { addTripPlaces, getTripPlaceIds, TRIP_EVENT } from "@/lib/trip/storage";
import { track } from "@/lib/analytics/track";

export function AddRouteToTripButton({
  routeId,
  placeIds,
}: {
  routeId: string;
  placeIds: string[];
}) {
  const t = useTranslations("route");
  const [allAdded, setAllAdded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function sync() {
      const current = new Set(await getTripPlaceIds());
      if (!cancelled) setAllAdded(placeIds.every((id) => current.has(id)));
    }
    void sync();
    window.addEventListener(TRIP_EVENT, sync);
    return () => {
      cancelled = true;
      window.removeEventListener(TRIP_EVENT, sync);
    };
  }, [placeIds]);

  async function handleClick() {
    await addTripPlaces(placeIds);
    track({ name: "route_added_to_trip", properties: { routeId } });
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={allAdded}
      className="bg-accent text-accent-foreground rounded-full px-4 py-2 text-sm font-medium disabled:opacity-60"
    >
      {allAdded ? t("addedToTrip") : t("addToTrip")}
    </button>
  );
}
