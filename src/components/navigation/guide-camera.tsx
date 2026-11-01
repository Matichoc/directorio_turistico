"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ManeuverIcon } from "@/components/ui/category-icon";
import type { GeoPoint } from "@/lib/itinerary-engine/geo";
import {
  bearingDegrees,
  formatMeters,
  headingFromOrientation,
  relativeBearing,
} from "@/lib/navigation/geo";
import type { GuideAction } from "@/lib/navigation/guidance";
import type { LivePosition } from "@/components/navigation/use-live-guide";

type OrientationEventCtor = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

/**
 * Guía a pie con la cámara abierta. Pedido del usuario: "cuando voy con la
 * cámara abierta, lo que me muestre realmente es la ruta hacia dónde tengo
 * que ir. No una brújula hacia dónde está la dirección, porque puede que por
 * calle tenga que doblar hacia otro lado antes". Por eso la flecha no apunta
 * al destino: apunta a un punto de la calle unos metros más adelante sobre el
 * camino (`guide().aim`), que al acercarse a una esquina ya está doblando — y
 * arriba va el próximo giro escrito ("En 40 m, dobla a la derecha por
 * Serrano"). No es realidad aumentada anclada al suelo (Safari no la soporta
 * en la web), pero funciona en iPhone y Android; sin cámara o sin orientación
 * sigue funcionando con menos. Basado en `WalkCamera` del directorio de Papudo.
 */
export function GuideCamera({
  position,
  aim,
  action,
  instruction,
  metersToStep,
  targetName,
  remainingMeters,
  arrived,
  onClose,
}: {
  position: LivePosition | null;
  aim: GeoPoint | null;
  action: GuideAction | null;
  instruction: string | null;
  metersToStep: number | null;
  targetName: string;
  remainingMeters: number | null;
  arrived: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("guide");
  const locale = useLocale();
  const videoRef = useRef<HTMLVideoElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [camera, setCamera] = useState<"starting" | "on" | "off">("starting");
  const [compass, setCompass] = useState<number | null>(null);
  const [needsCompassPermission, setNeedsCompassPermission] = useState(
    () =>
      typeof window !== "undefined" &&
      typeof (window.DeviceOrientationEvent as OrientationEventCtor | undefined)
        ?.requestPermission === "function",
  );

  // Cámara trasera; se apaga al cerrar.
  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    if (!navigator.mediaDevices?.getUserMedia) {
      queueMicrotask(() => setCamera("off"));
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" } } })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((track) => track.stop());
          return;
        }
        stream = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          void videoRef.current.play().catch(() => undefined);
        }
        setCamera("on");
      })
      .catch(() => setCamera("off"));
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  // Orientación del teléfono (Android directo; iOS después del permiso).
  useEffect(() => {
    if (needsCompassPermission) return;
    const onOrientation = (e: DeviceOrientationEvent) => {
      const h = headingFromOrientation(
        e as DeviceOrientationEvent & { webkitCompassHeading?: number },
        window.screen.orientation?.angle ?? 0,
      );
      if (h !== null) setCompass(Math.round(h));
    };
    const name =
      "ondeviceorientationabsolute" in window
        ? "deviceorientationabsolute"
        : "deviceorientation";
    window.addEventListener(name, onOrientation as EventListener);
    return () =>
      window.removeEventListener(name, onOrientation as EventListener);
  }, [needsCompassPermission]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function askCompass() {
    const ctor = window.DeviceOrientationEvent as OrientationEventCtor;
    try {
      await ctor.requestPermission?.();
    } catch {
      // Rechazado: se usa la dirección de movimiento del GPS.
    }
    setNeedsCompassPermission(false);
  }

  const heading = compass ?? position?.course ?? null;
  const rotation =
    position && aim && heading !== null
      ? relativeBearing(bearingDegrees(position, aim), heading)
      : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-camera-title"
      className="fixed inset-0 z-[70] flex flex-col bg-[#07060c] text-white"
    >
      <video
        ref={videoRef}
        muted
        playsInline
        aria-hidden="true"
        className={`absolute inset-0 size-full object-cover ${
          camera === "on" ? "" : "hidden"
        }`}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/75" />

      <header className="relative flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-amber-300 uppercase">
            {t("towards", { name: targetName })}
          </p>
          {arrived ? (
            <h2
              id="guide-camera-title"
              className="font-display text-2xl font-semibold"
            >
              {t("arrived", { name: targetName })}
            </h2>
          ) : (
            <div className="mt-1 flex items-center gap-3">
              {action && (
                <span className="bg-accent text-accent-foreground flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-[0_0_20px_2px_var(--accent-soft)]">
                  <ManeuverIcon action={action} className="h-7 w-7" />
                </span>
              )}
              <div className="min-w-0">
                {metersToStep !== null && (
                  <p className="text-sm font-medium text-white/80">
                    {t("inDistance", {
                      distance: formatMeters(metersToStep, locale),
                    })}
                  </p>
                )}
                <h2
                  id="guide-camera-title"
                  className="text-xl leading-tight font-semibold"
                >
                  {instruction ?? t("calculating")}
                </h2>
              </div>
            </div>
          )}
        </div>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-medium text-[#07060c]"
        >
          {t("cameraClose")}
        </button>
      </header>

      <div className="relative flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        {arrived ? (
          <p className="animate-check-pop text-6xl" aria-hidden="true">
            🎉
          </p>
        ) : rotation !== null ? (
          <svg
            viewBox="0 0 100 100"
            className="size-52 drop-shadow-[0_6px_18px_rgba(0,0,0,0.6)] transition-transform duration-300 ease-out motion-reduce:transition-none"
            style={{ transform: `rotate(${rotation}deg)` }}
            role="img"
            aria-label={t("arrowLabel")}
          >
            <path
              d="M50 6 86 62H62v32H38V62H14Z"
              fill="var(--accent)"
              stroke="white"
              strokeWidth="3"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <p className="max-w-xs rounded-2xl bg-black/55 p-4 text-base font-medium">
            {position ? t("noHeading") : t("waitingGps")}
          </p>
        )}
        {remainingMeters !== null && !arrived && (
          <p className="font-display text-4xl font-semibold drop-shadow-lg">
            {formatMeters(remainingMeters, locale)}
          </p>
        )}
        {needsCompassPermission && (
          <button
            type="button"
            onClick={askCompass}
            className="bg-accent text-accent-foreground rounded-full px-6 py-3 font-medium shadow-lg"
          >
            {t("enableCompass")}
          </button>
        )}
      </div>

      <p className="relative p-4 text-center text-xs text-white/85">
        {camera === "off" ? `${t("cameraOff")} ` : null}
        {t("cameraSafety")}
      </p>
    </div>
  );
}
