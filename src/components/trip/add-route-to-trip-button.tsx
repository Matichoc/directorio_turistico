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
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

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
    setPending(true);
    setFailed(false);
    try {
      await addTripPlaces(placeIds);
      track({ name: "route_added_to_trip", properties: { routeId } });
    } catch (error) {
      console.error("[AddRouteToTripButton] no se pudo guardar", error);
      setFailed(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => void handleClick()}
        disabled={allAdded || pending}
        className="bg-accent text-accent-foreground w-fit rounded-full px-4 py-2 text-sm font-medium disabled:opacity-60"
      >
        {allAdded ? t("addedToTrip") : t("addToTrip")}
      </button>
      {failed && (
        <p role="alert" className="text-xs text-amber-300">
          {t("tripError")}
        </p>
      )}
    </div>
  );
}
