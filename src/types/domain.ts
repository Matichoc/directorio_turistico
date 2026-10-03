import type {
  Locale,
  PublicationStatus,
  VerificationStatus,
} from "@/types/database";

export type { Locale, PublicationStatus, VerificationStatus };

export interface Place {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  shortDescription: string | null;
  communeId: string;
  communeName: string;
  /** Pueblo al que pertenece, si se asignó uno (ver `types.Locality`). */
  localityId: string | null;
  localityName: string | null;
  localitySlug: string | null;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  /** Ícono puntual (ver migración 0010_place_icon.sql); null = de categoría. */
  icon: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  phone: string | null;
  website: string | null;
  photos: { url: string; attribution: string | null }[];
  isFeatured: boolean;
  publicationStatus: PublicationStatus;
  verificationStatus: VerificationStatus;
  tags: string[];
}

export interface RouteStop {
  id: string;
  placeId: string;
  placeSlug: string;
  placeName: string;
  placeShortDescription: string | null;
  placePhotoUrl: string | null;
  categorySlug: string | null;
  /** Ícono puntual del lugar (ver migración 0010_place_icon.sql). */
  placeIcon: string | null;
  latitude: number;
  longitude: number;
  position: number;
  notes: string | null;
}

export interface Route {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  estimatedDurationMinutes: number | null;
  /** Portada curada a mano (ver `routes.cover_image`); null si no tiene. */
  coverImageUrl: string | null;
  publicationStatus: PublicationStatus;
  stops: RouteStop[];
}

export interface Commune {
  id: string;
  slug: string;
  name: string;
}

/**
 * "Pueblo" — dimensión entre comuna y lugar (comuna → pueblo → lugares),
 * pedida por el usuario para armar un mapa real de la provincia. Reusa
 * `localities` (en el esquema desde `0002_catalog.sql`, nunca poblada
 * hasta ahora) en vez de una tabla nueva.
 */
export interface Locality {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  communeId: string;
  communeName: string;
  /** Null mientras no se confirme una coordenada real (ver docs/DESIGN.md). */
  latitude: number | null;
  longitude: number | null;
}

export interface LocalityWithPlaces extends Locality {
  places: PlaceCard[];
}

export interface Sponsor {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  logoPath: string;
  websiteUrl: string | null;
  instagramUrl: string | null;
}

export interface MunicipalityLink {
  kind: string;
  value: string;
  label: string | null;
}

export interface Municipality extends Commune {
  links: MunicipalityLink[];
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string | null;
}

export interface PlaceCard {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  communeName: string;
  /** Pueblo al que pertenece, si se asignó uno — ver `Place.localityId`. */
  localityName: string | null;
  localitySlug: string | null;
  categoryName: string;
  categorySlug: string;
  /** Ícono puntual (ver migración 0010_place_icon.sql); null = de categoría. */
  icon: string | null;
  latitude: number;
  longitude: number;
  verificationStatus: VerificationStatus;
  isFeatured: boolean;
  photoUrl: string | null;
  photoCount: number;
  tags: string[];
}

export interface RouteCard {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  estimatedDurationMinutes: number | null;
  stopsCount: number;
  photoUrl: string | null;
}

export interface PlaceFilters {
  communeSlug?: string;
  categorySlug?: string;
  tagSlug?: string;
  query?: string;
}
