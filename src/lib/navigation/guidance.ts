import type { GeoPoint } from "@/lib/itinerary-engine/geo";
import {
  pointAlong,
  snapToPolyline,
  type RouteSnap,
} from "@/lib/navigation/geo";
import type {
  RouteStep,
  StreetRoute,
  TravelMode,
} from "@/lib/navigation/street-route";

/**
 * Guía paso a paso: dónde va la persona sobre la ruta por calles, cuál es el
 * próximo giro y hacia dónde apuntar. Pedido del usuario: "no quiero una
 * brújula, quiero una guía de vete por aquí, vete por allá" — por eso todo se
 * mide sobre la ruta por calles (los giros reales), nunca en línea recta al
 * destino. Funciones puras: la interfaz (`LiveGuide`) solo las llama con cada
 * posición nueva del GPS.
 */

/** Lejos de la ruta más que esto (m) = te saliste: se recalcula. */
export const OFF_ROUTE_M: Record<TravelMode, number> = { walk: 35, car: 70 };
/** A esta distancia (m) del final se considera que llegaste. */
export const ARRIVAL_M: Record<TravelMode, number> = { walk: 30, car: 60 };
/** Desde aquí (m) se avisa el giro que viene ("en 80 m, dobla…"). */
export const PREPARE_M: Record<TravelMode, number> = { walk: 70, car: 350 };
/** Desde aquí (m) se dice "ahora, dobla…". */
export const NOW_M: Record<TravelMode, number> = { walk: 15, car: 60 };
/**
 * La flecha de la cámara apunta a un punto de la calle este tanto más
 * adelante: al acercarse a una esquina, ese punto ya está doblando, así que
 * la flecha muestra el giro antes de llegar a él.
 */
export const LOOKAHEAD_M: Record<TravelMode, number> = { walk: 25, car: 80 };

/** Qué hacer en un giro, en palabras que la interfaz traduce. */
export type GuideAction =
  | "straight"
  | "left"
  | "right"
  | "slightLeft"
  | "slightRight"
  | "sharpLeft"
  | "sharpRight"
  | "keepLeft"
  | "keepRight"
  | "uturn"
  | "roundabout"
  | "arrive";

export interface Instruction {
  action: GuideAction;
  /** Calle por la que se sigue; "" si no tiene nombre. */
  street: string;
  /** Salida de la rotonda, si aplica. */
  exit: number | null;
}

const TURN_BY_MODIFIER: Record<string, GuideAction> = {
  left: "left",
  right: "right",
  "slight left": "slightLeft",
  "slight right": "slightRight",
  "sharp left": "sharpLeft",
  "sharp right": "sharpRight",
  straight: "straight",
  uturn: "uturn",
};

/** Traduce un giro de OSRM a una acción simple ("dobla a la derecha"). */
export function instructionFor(step: RouteStep): Instruction {
  const base = { street: step.street, exit: step.exit };
  if (step.type === "arrive") return { ...base, action: "arrive" };
  if (
    step.type === "roundabout" ||
    step.type === "rotary" ||
    step.type === "roundabout turn"
  ) {
    return { ...base, action: "roundabout" };
  }
  const modifier = step.modifier ?? "straight";
  if (step.type === "fork" || step.type === "merge") {
    if (modifier.includes("left")) return { ...base, action: "keepLeft" };
    if (modifier.includes("right")) return { ...base, action: "keepRight" };
  }
  // "continue", "new name" y similares: seguir, salvo que el modificador
  // diga claramente que hay que doblar.
  return { ...base, action: TURN_BY_MODIFIER[modifier] ?? "straight" };
}

export interface Guidance {
  snap: RouteSnap;
  /** Te alejaste de la ruta: hay que recalcularla desde donde estás. */
  offRoute: boolean;
  arrived: boolean;
  /** Metros que faltan por la calle hasta el destino. */
  remainingMeters: number;
  /** Próximo giro (o la llegada), con su texto y a cuántos metros está. */
  next: { step: RouteStep; instruction: Instruction; meters: number } | null;
  /** Punto de la calle hacia donde apuntar la flecha de la cámara. */
  aim: GeoPoint;
}

/** Ubica a la persona sobre la ruta y dice qué viene. Null sin ruta. */
export function guide(
  position: GeoPoint,
  route: StreetRoute,
  accuracyMeters = 0,
  /**
   * Distancia (m) entre donde estaba la persona al pedir la ruta y su inicio:
   * si se partió lejos de una calle (un potrero, un cerro), la ruta empieza
   * en la calle más cercana y esa distancia no es "salirse del camino".
   */
  startGapMeters = 0,
): Guidance | null {
  const snap = snapToPolyline(position, route.coordinates);
  if (!snap) return null;

  const mode = route.mode;
  // Con GPS impreciso se toleran un poco más ambas distancias.
  const slack = Math.min(40, accuracyMeters / 2);
  const remainingMeters = Math.max(0, route.distanceMeters - snap.along);
  const arrived = remainingMeters <= ARRIVAL_M[mode] + slack;
  const offRoute =
    !arrived && snap.distance > OFF_ROUTE_M[mode] + slack + startGapMeters;

  // El primer giro que todavía está adelante (la salida no cuenta: es donde
  // se partió). Unos metros de margen para no anunciar uno ya pasado.
  const nextStep = route.steps.find(
    (step) => step.type !== "depart" && step.atMeters > snap.along + 3,
  );

  return {
    snap,
    offRoute,
    arrived,
    remainingMeters,
    next: nextStep
      ? {
          step: nextStep,
          instruction: instructionFor(nextStep),
          meters: Math.max(0, nextStep.atMeters - snap.along),
        }
      : null,
    aim: pointAlong(route.coordinates, snap.along + LOOKAHEAD_M[mode]),
  };
}

/** En qué punto del aviso de un giro va la persona. */
export type AnnounceStage = "far" | "prepare" | "now";

export function announceStage(meters: number, mode: TravelMode): AnnounceStage {
  if (meters <= NOW_M[mode]) return "now";
  if (meters <= PREPARE_M[mode]) return "prepare";
  return "far";
}

/** Modo sugerido según la distancia en línea recta (a pie hasta ~1,5 km). */
export const WALK_SUGGEST_MAX_M = 1500;

export function suggestedMode(straightMeters: number): TravelMode {
  return straightMeters <= WALK_SUGGEST_MAX_M ? "walk" : "car";
}
