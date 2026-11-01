import type { LngLat } from "@/lib/navigation/geo";

/** Cómo se recorre el tramo: a pie o en auto. */
export type TravelMode = "walk" | "car";

/**
 * Un giro de la ruta (una "maniobra" en OSRM): qué hacer y dónde. `type` y
 * `modifier` son los de OSRM (https://project-osrm.org/docs/v5.24.0/api/#stepmaneuver-object);
 * el texto ("dobla a la derecha por Serrano") lo arma la interfaz en el
 * idioma de la persona, ver `lib/navigation/guidance.ts`.
 */
export interface RouteStep {
  type: string;
  modifier: string | null;
  /** Calle por la que se sigue después del giro ("" si no tiene nombre). */
  street: string;
  /** Dónde está el giro. */
  location: LngLat;
  /** Metros recorridos desde el inicio de la ruta hasta el giro. */
  atMeters: number;
  /** Salida de una rotonda (1 = la primera), si aplica. */
  exit: number | null;
}

/** Ruta por calles entre dos puntos. `coordinates` va como GeoJSON: [lng, lat]. */
export interface StreetRoute {
  mode: TravelMode;
  distanceMeters: number;
  durationSeconds: number;
  coordinates: LngLat[];
  steps: RouteStep[];
}
