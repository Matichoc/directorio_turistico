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
  categoryId: string;
  latitude: number;
  longitude: number;
  address: string | null;
  phone: string | null;
  website: string | null;
  publicationStatus: PublicationStatus;
  verificationStatus: VerificationStatus;
  tags: string[];
}

export interface RouteStop {
  id: string;
  placeId: string;
  placeName: string;
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
