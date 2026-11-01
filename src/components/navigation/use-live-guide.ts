"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { distanceMeters, type LngLat } from "@/lib/navigation/geo";
import { guide, suggestedMode } from "@/lib/navigation/guidance";
import { fetchStreetRoute } from "@/lib/navigation/route-client";
import type { StreetRoute, TravelMode } from "@/lib/navigation/street-route";

export interface LivePosition {
  latitude: number;
  longitude: number;
  accuracy: number;
  /** Hacia dónde se mueve según el GPS (grados), si se está moviendo. */
  course: number | null;
}

export interface GuideTarget {
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
}

/** Tras recalcular por desvío, esperar esto antes de volver a hacerlo. */
const RECALC_COOLDOWN_MS = 10_000;

/**
 * Estado de la guía en vivo: posición (GPS), modo sugerido, ruta por calles
 * hasta la parada y dónde va la persona sobre ella (`guide`). La ruta se pide
 * al empezar, al cambiar de parada o de modo, y al salirse del camino.
 */
export function useLiveGuide({
  active,
  target,
  modeChoice,
}: {
  active: boolean;
  target: GuideTarget | null;
  /** Modo elegido a mano; sin él, el sugerido por la distancia. */
  modeChoice: TravelMode | null;
}) {
  const [position, setPosition] = useState<LivePosition | null>(null);
  const [denied, setDenied] = useState(false);
  const [suggested, setSuggested] = useState<TravelMode | null>(null);
  const [recalcTick, setRecalcTick] = useState(0);
  const [routeState, setRouteState] = useState<{
    key: string;
    route: StreetRoute | null;
    /** Distancia de donde se pidió la ruta a su inicio (ver `guide`). */
    startGap: number;
  } | null>(null);

  const mode = modeChoice ?? suggested;
  const wantedKey =
    target && mode ? `${target.slug}:${mode}:${recalcTick}` : null;
  const route = routeState?.key === wantedKey ? routeState.route : null;
  const startGap = route ? (routeState?.startGap ?? 0) : 0;

  // Lo que el callback del GPS necesita leer sin re-suscribirse.
  const latest = useRef({ target, route, startGap, lastRecalcAt: 0 });
  useEffect(() => {
    latest.current.target = target;
    latest.current.route = route;
    latest.current.startGap = startGap;
  }, [target, route, startGap]);
  const positionRef = useRef<LivePosition | null>(null);

  useEffect(() => {
    if (!active) return;
    if (!navigator.geolocation) {
      queueMicrotask(() => setDenied(true));
      return;
    }
    const id = navigator.geolocation.watchPosition(
      (fix) => {
        const next: LivePosition = {
          latitude: fix.coords.latitude,
          longitude: fix.coords.longitude,
          accuracy: fix.coords.accuracy ?? 0,
          course:
            fix.coords.heading !== null && !Number.isNaN(fix.coords.heading)
              ? fix.coords.heading
              : null,
        };
        positionRef.current = next;
        setPosition(next);
        setDenied(false);

        const {
          target: currentTarget,
          route: currentRoute,
          startGap: currentGap,
        } = latest.current;
        if (currentTarget) {
          // El modo se sugiere una sola vez, con la primera posición: así no
          // cambia solo a mitad de camino.
          setSuggested(
            (prev) =>
              prev ?? suggestedMode(distanceMeters(next, currentTarget)),
          );
        }
        if (currentRoute) {
          const g = guide(next, currentRoute, next.accuracy, currentGap);
          const now = Date.now();
          if (
            g?.offRoute &&
            now - latest.current.lastRecalcAt > RECALC_COOLDOWN_MS
          ) {
            latest.current.lastRecalcAt = now;
            setRecalcTick((tick) => tick + 1);
          }
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) setDenied(true);
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 20_000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [active]);

  const hasPosition = position !== null;
  useEffect(() => {
    const from = positionRef.current;
    if (!active || !wantedKey || !target || !mode || !from) return;
    const controller = new AbortController();
    void fetchStreetRoute(from, target, mode, controller.signal).then(
      (found) => {
        if (controller.signal.aborted) return;
        const start = found?.coordinates[0] as LngLat | undefined;
        setRouteState({
          key: wantedKey,
          route: found,
          startGap: start
            ? distanceMeters(from, { latitude: start[1], longitude: start[0] })
            : 0,
        });
      },
    );
    return () => controller.abort();
    // `hasPosition`: se pide apenas llega la primera posición.
  }, [active, wantedKey, target, mode, hasPosition]);

  const guidance = useMemo(
    () =>
      position && route
        ? guide(position, route, position.accuracy, startGap)
        : null,
    [position, route, startGap],
  );

  const routing = Boolean(
    active && hasPosition && wantedKey && routeState?.key !== wantedKey,
  );
  const noRoute = Boolean(
    wantedKey && routeState?.key === wantedKey && !routeState.route,
  );

  return {
    position,
    denied,
    mode,
    route,
    guidance,
    routing,
    noRoute,
    /** Para que la voz sepa cuándo hay una ruta nueva. */
    routeKey: route ? wantedKey : null,
  };
}
