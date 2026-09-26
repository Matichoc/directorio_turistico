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
