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
    function sync() {
      const current = new Set(getTripPlaceIds());
      setAllAdded(placeIds.every((id) => current.has(id)));
    }
    sync();
    window.addEventListener(TRIP_EVENT, sync);
    return () => window.removeEventListener(TRIP_EVENT, sync);
  }, [placeIds]);

  return (
    <button
      type="button"
      onClick={() => {
        addTripPlaces(placeIds);
        track({ name: "route_added_to_trip", properties: { routeId } });
      }}
      disabled={allAdded}
      className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
    >
      {allAdded ? t("addedToTrip") : t("addToTrip")}
    </button>
  );
}
