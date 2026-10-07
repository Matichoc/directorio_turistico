"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics/track";
import type { AnalyticsEvent } from "@/lib/analytics/events";

/**
 * Registra un evento anónimo una vez al montarse — para que páginas que
 * son server components (ficha de lugar/ruta/pueblo, `/explorar`) puedan
 * medir visitas sin volverse client components. No renderiza nada.
 */
export function TrackEvent({ event }: { event: AnalyticsEvent }) {
  const serialized = JSON.stringify(event);
  useEffect(() => {
    track(JSON.parse(serialized) as AnalyticsEvent);
  }, [serialized]);
  return null;
}
