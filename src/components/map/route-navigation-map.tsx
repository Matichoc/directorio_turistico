"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MapView, type MapMarkerData } from "@/components/map/map-view";
import { AvatarPicker } from "@/components/map/avatar-picker";
import { ManeuverIcon } from "@/components/ui/category-icon";
import { GuideCamera } from "@/components/navigation/guide-camera";
import { useLiveGuide } from "@/components/navigation/use-live-guide";
import {
  formatMeters,
  formatMinutes,
  remainingLine,
} from "@/lib/navigation/geo";
import { announceStage, type Instruction } from "@/lib/navigation/guidance";
import { externalDirectionsUrl } from "@/lib/navigation/route-client";
import type { TravelMode } from "@/lib/navigation/street-route";
import { SPEECH_LANG, speakNow, stopSpeaking } from "@/lib/speech";

const lowerFirst = (text: string) =>
  text ? text[0].toLocaleLowerCase() + text.slice(1) : text;

/**
 * Mapa de una ruta (o de "Mi recorrido") con la guía paso a paso: desde donde
 * estás hasta la próxima parada, por calle, a pie o en auto, con cada giro
 * escrito ("En 80 m, dobla a la derecha por Serrano"), dicho en voz alta y,
 * a pie, con la cámara. Pedido del usuario (2026-11-01): no había mapa para
 * hacer la ruta a pie, y "no quiero una brújula, quiero una guía de vete por
 * aquí, vete por allá". Al llegar a una parada ofrece seguir a la siguiente;
 * tocar otra parada en el mapa cambia el destino. Rutas: OpenStreetMap (OSRM)
 * vía /api/ruta — ver `lib/navigation/osrm.ts`.
 *
 * Si no se puede calcular el camino (sin red, fuera de la zona), no rompe
 * nada: el mapa sigue con las paradas y queda el link a Google Maps.
 */
export function RouteNavigationMap({
  className,
  markers,
  highlightedSlug,
  onMarkerClick,
}: {
  className?: string;
  markers: MapMarkerData[];
  highlightedSlug?: string | null;
  onMarkerClick?: (slug: string) => void;
}) {
  const t = useTranslations("guide");
  const locale = useLocale();
  const lang = SPEECH_LANG[locale === "en" ? "en" : "es"];
  const stops = markers.filter((marker) => marker.kind !== "locality");

  const [active, setActive] = useState(false);
  const [targetIndex, setTargetIndex] = useState(0);
  const [modeChoice, setModeChoice] = useState<TravelMode | null>(null);
  const [voice, setVoice] = useState(true);
  const [cameraOpen, setCameraOpen] = useState(false);

  const target = stops[targetIndex] ?? null;
  const live = useLiveGuide({ active, target, modeChoice });
  const { guidance, route, mode, position } = live;

  const instructionText = (instruction: Instruction) =>
    t(`action.${instruction.action}`, {
      street: instruction.street || "none",
      exit: instruction.exit ?? 1,
      name: target?.name ?? "",
    });

  // Fuera del camino, el próximo giro del camino viejo ya no sirve: hasta
  // tener el nuevo solo se avisa que se está recalculando.
  const next = guidance && !guidance.offRoute ? guidance.next : null;
  const nextText = next ? instructionText(next.instruction) : null;
  const arrived = guidance?.arrived ?? false;
  const nextStop = stops[targetIndex + 1] ?? null;

  // Voz: cada giro apenas pasa a ser el próximo ("en 140 m, dobla…"), otra
  // vez al acercarse y justo en la esquina ("ahora, dobla…"), y la llegada.
  // Cada aviso una sola vez (la clave recuerda el último dicho).
  const lastSaid = useRef<string | null>(null);
  useEffect(() => {
    if (!active || !voice || !guidance || !mode || !target) return;
    let key: string;
    let text: string;
    if (guidance.arrived) {
      key = `arrived:${target.slug}`;
      text = t("arrived", { name: target.name });
    } else if (next && nextText) {
      const stage = announceStage(next.meters, mode);
      key = `${live.routeKey}:${next.step.atMeters}:${stage}`;
      text =
        stage === "now"
          ? `${t("now")}, ${lowerFirst(nextText)}`
          : `${t("inDistance", { distance: formatMeters(next.meters, locale) })}, ${lowerFirst(nextText)}`;
    } else {
      return;
    }
    if (lastSaid.current === key) return;
    lastSaid.current = key;
    speakNow(text, lang);
  }, [
    active,
    voice,
    guidance,
    next,
    nextText,
    mode,
    target,
    live.routeKey,
    locale,
    lang,
    t,
  ]);

  function stop() {
    setActive(false);
    setCameraOpen(false);
    stopSpeaking();
    lastSaid.current = null;
  }

  function handleMarkerClick(slug: string) {
    onMarkerClick?.(slug);
    if (!active) return;
    const index = stops.findIndex((stopMarker) => stopMarker.slug === slug);
    if (index !== -1) setTargetIndex(index);
  }

  const remainingMinutes =
    route && guidance && route.distanceMeters > 0
      ? Math.round(
          (route.durationSeconds / 60) *
            (guidance.remainingMeters / route.distanceMeters),
        )
      : null;

  const routeLine =
    route && guidance
      ? remainingLine(route.coordinates, guidance.snap)
      : (route?.coordinates ?? undefined);

  const modeButton = (value: TravelMode) => (
    <button
      type="button"
      onClick={() => setModeChoice(value)}
      aria-pressed={mode === value}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        mode === value
          ? "bg-accent text-accent-foreground"
          : "text-foreground/70 hover:text-foreground"
      }`}
    >
      {t(value)}
    </button>
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => (active ? stop() : setActive(true))}
          disabled={stops.length === 0}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            active
              ? "bg-foreground text-background"
              : "bg-accent text-accent-foreground shadow-[0_0_20px_2px_var(--accent-soft)]"
          }`}
        >
          {active ? t("stop") : t("start")}
        </button>
        {active && (
          <>
            <div
              role="group"
              aria-label={t("modeLabel")}
              className="surface-glass flex rounded-full p-0.5"
            >
              {modeButton("walk")}
              {modeButton("car")}
            </div>
            <button
              type="button"
              onClick={() => {
                if (voice) stopSpeaking();
                setVoice(!voice);
              }}
              aria-pressed={voice}
              className="surface-glass rounded-full px-3 py-1.5 text-xs"
            >
              {voice ? `🔊 ${t("voiceOn")}` : `🔇 ${t("voiceOff")}`}
            </button>
            {mode === "walk" && (
              <button
                type="button"
                onClick={() => setCameraOpen(true)}
                className="surface-glass rounded-full px-3 py-1.5 text-xs"
              >
                📷 {t("camera")}
              </button>
            )}
          </>
        )}
      </div>

      {active && target && (
        <div
          aria-live="polite"
          className="surface-glass flex flex-col gap-2 rounded-2xl p-3"
        >
          <p className="text-xs font-semibold tracking-wide text-amber-300 uppercase">
            {t("towards", { name: target.name })}
          </p>

          {live.denied ? (
            <p className="text-sm">{t("gpsDenied")}</p>
          ) : !position ? (
            <p className="text-foreground/70 text-sm">{t("waitingGps")}</p>
          ) : arrived ? (
            <div className="flex flex-wrap items-center gap-3">
              <p className="animate-check-pop text-lg font-semibold">
                {t("arrived", { name: target.name })}
              </p>
              {nextStop ? (
                <button
                  type="button"
                  onClick={() => setTargetIndex(targetIndex + 1)}
                  className="bg-accent text-accent-foreground rounded-full px-4 py-2 text-sm font-medium"
                >
                  {t("goNext", { name: nextStop.name })} →
                </button>
              ) : (
                <p className="text-sm">{t("finished")}</p>
              )}
            </div>
          ) : live.routing ? (
            <p className="text-foreground/70 text-sm">{t("calculating")}</p>
          ) : guidance?.offRoute ? (
            <p className="text-sm text-amber-300">{t("offRoute")}</p>
          ) : live.noRoute ? (
            <p className="text-sm">{t("noRoute")}</p>
          ) : next && nextText ? (
            <div className="flex items-center gap-3">
              <span className="bg-accent text-accent-foreground flex h-12 w-12 shrink-0 items-center justify-center rounded-full shadow-[0_0_20px_2px_var(--accent-soft)]">
                <ManeuverIcon action={next.instruction.action} />
              </span>
              <div className="min-w-0">
                <p className="text-foreground/70 text-xs">
                  {t("inDistance", {
                    distance: formatMeters(next.meters, locale),
                  })}
                </p>
                <p className="text-base leading-snug font-semibold">
                  {nextText}
                </p>
              </div>
            </div>
          ) : null}

          {guidance && !arrived && remainingMinutes !== null && (
            <p className="text-foreground/70 text-xs">
              {t("remaining", {
                distance: formatMeters(guidance.remainingMeters, locale),
                time: formatMinutes(remainingMinutes),
              })}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <a
              href={externalDirectionsUrl(target, mode ?? "car")}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent underline"
            >
              {t("openExternal")}
            </a>
            {stops.length > 1 && (
              <span className="text-foreground/50">{t("pickStop")}</span>
            )}
          </div>
          <p className="text-foreground/50 text-[11px]">
            {t("privacy")} {t("attribution")}
          </p>
        </div>
      )}

      <AvatarPicker />

      <MapView
        className={className}
        markers={markers}
        routeLine={active ? routeLine : undefined}
        livePosition={active ? position : undefined}
        followLivePosition={active}
        highlightedSlug={active ? (target?.slug ?? null) : highlightedSlug}
        onMarkerClick={handleMarkerClick}
      />

      {cameraOpen && target && (
        <GuideCamera
          position={position}
          aim={guidance?.aim ?? null}
          action={next?.instruction.action ?? null}
          instruction={nextText}
          metersToStep={next?.meters ?? null}
          targetName={target.name}
          remainingMeters={guidance?.remainingMeters ?? null}
          arrived={arrived}
          onClose={() => setCameraOpen(false)}
        />
      )}
    </div>
  );
}
