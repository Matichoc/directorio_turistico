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
  latitude: number;
  longitude: number;
  address: string | null;
  phone: string | null;
  website: string | null;
  photos: { url: string; attribution: string | null }[];
  publicationStatus: PublicationStatus;
  verificationStatus: VerificationStatus;
  tags: string[];
}

export interface RouteStop {
  id: string;
  placeId: string;
  placeSlug: string;
  placeName: string;
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
  latitude: number;
  longitude: number;
  verificationStatus: VerificationStatus;
  photoUrl: string | null;
  tags: string[];
}

export interface RouteCard {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  estimatedDurationMinutes: number | null;
  stopsCount: number;
}

export interface PlaceFilters {
  communeSlug?: string;
  categorySlug?: string;
  tagSlug?: string;
  query?: string;
}
