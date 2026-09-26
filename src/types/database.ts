// Tipos de la base de datos, alineados a `supabase/migrations/*.sql`.
// TODO: reemplazar por `supabase gen types typescript` una vez exista un
// proyecto Supabase real (ver docs/DATA-MODEL.md).
//
// `Relationships` queda vacío a propósito: sin un proyecto real no hay
// metadata de FKs que generar. Por eso `lib/data/*` tipa el resultado de
// selects con relaciones embebidas explícitamente vía el segundo genérico
// de `.select<Query, Result>()`, en vez de depender de la inferencia
// automática de PostgREST (que si requiere `Relationships`).

export type Locale = "es" | "en";
export type PublicationStatus = "draft" | "published" | "archived";
export type VerificationStatus = "pending" | "verified" | "outdated";
export type EntityType = "place" | "route";

type Table<Row, Insert, Update> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

type CommuneRow = {
  id: string;
  slug: string;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at: string;
};

type CommuneTranslationRow = {
  commune_id: string;
  locale: Locale;
  name: string;
  description: string | null;
};

type LocalityRow = {
  id: string;
  commune_id: string;
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
  created_at: string;
};

type CategoryRow = {
  id: string;
  slug: string;
  icon: string | null;
  created_at: string;
};

type CategoryTranslationRow = {
  category_id: string;
  locale: Locale;
  name: string;
};

type TagRow = {
  id: string;
  slug: string;
  name: string;
  created_at: string;
};

type PlaceRow = {
  id: string;
  slug: string;
  commune_id: string;
  locality_id: string | null;
  category_id: string;
  latitude: number;
  longitude: number;
  address: string | null;
  phone: string | null;
  website: string | null;
  // Posición publicitaria pagada (gestionada a mano, sin pasarela de pago):
  // null = no destacado; fecha futura = destacado hasta esa fecha.
  featured_until: string | null;
  // Ícono "de la zona" puntual (ver migración 0010_place_icon.sql): null usa
  // el ícono de la categoría.
  icon: string | null;
  publication_status: PublicationStatus;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at: string;
};

type PlaceTranslationRow = {
  place_id: string;
  locale: Locale;
  name: string;
  short_description: string | null;
  description: string | null;
  needs_review: boolean;
};

type PlaceHoursRow = {
  id: string;
  place_id: string;
  day_of_week: number;
  opens_at: string | null;
  closes_at: string | null;
  closed: boolean;
};

type PlaceImageRow = {
  id: string;
  place_id: string;
  storage_path: string;
  alt_text: string | null;
  position: number;
};

type PlaceTagRow = { place_id: string; tag_id: string };

type RouteRow = {
  id: string;
  slug: string;
  cover_image: string | null;
  estimated_duration_minutes: number | null;
  publication_status: PublicationStatus;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at: string;
};

type RouteTranslationRow = {
  route_id: string;
  locale: Locale;
  name: string;
  description: string | null;
};

type RouteStopRow = {
  id: string;
  route_id: string;
  place_id: string;
  position: number;
};

type RouteStopTranslationRow = {
  route_stop_id: string;
  locale: Locale;
  notes: string | null;
};

type SourceRow = {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  url: string;
  label: string | null;
  created_at: string;
};

type VerificationLogRow = {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  status: VerificationStatus;
  notes: string | null;
  verified_by: string | null;
  verified_at: string;
};

type ItineraryRow = {
  id: string;
  session_id: string;
  name: string | null;
  created_at: string;
};

type ItineraryStopRow = {
  id: string;
  itinerary_id: string;
  place_id: string;
  position: number;
  planned_at: string | null;
};

type AnalyticsEventRow = {
  id: string;
  name: string;
  properties: Record<string, string | number | boolean | null>;
  created_at: string;
};

export interface Database {
  public: {
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
    Tables: {
      communes: Table<
        CommuneRow,
        Partial<CommuneRow> & { slug: string },
        Partial<CommuneRow>
      >;
      commune_translations: Table<
        CommuneTranslationRow,
        Partial<CommuneTranslationRow> & {
          commune_id: string;
          locale: Locale;
          name: string;
        },
        Partial<CommuneTranslationRow>
      >;
      localities: Table<
        LocalityRow,
        Partial<LocalityRow> & {
          commune_id: string;
          slug: string;
          name: string;
          latitude: number;
          longitude: number;
        },
        Partial<LocalityRow>
      >;
      categories: Table<
        CategoryRow,
        Partial<CategoryRow> & { slug: string },
        Partial<CategoryRow>
      >;
      category_translations: Table<
        CategoryTranslationRow,
        Partial<CategoryTranslationRow> & {
          category_id: string;
          locale: Locale;
          name: string;
        },
        Partial<CategoryTranslationRow>
      >;
      tags: Table<
        TagRow,
        Partial<TagRow> & { slug: string; name: string },
        Partial<TagRow>
      >;
      places: Table<
        PlaceRow,
        Partial<PlaceRow> & {
          slug: string;
          commune_id: string;
          category_id: string;
          latitude: number;
          longitude: number;
        },
        Partial<PlaceRow>
      >;
      place_translations: Table<
        PlaceTranslationRow,
        Partial<PlaceTranslationRow> & {
          place_id: string;
          locale: Locale;
          name: string;
        },
        Partial<PlaceTranslationRow>
      >;
      place_hours: Table<
        PlaceHoursRow,
        Partial<PlaceHoursRow> & { place_id: string; day_of_week: number },
        Partial<PlaceHoursRow>
      >;
      place_images: Table<
        PlaceImageRow,
        Partial<PlaceImageRow> & { place_id: string; storage_path: string },
        Partial<PlaceImageRow>
      >;
      place_tags: Table<PlaceTagRow, PlaceTagRow, Partial<PlaceTagRow>>;
      routes: Table<
        RouteRow,
        Partial<RouteRow> & { slug: string },
        Partial<RouteRow>
      >;
      route_translations: Table<
        RouteTranslationRow,
        Partial<RouteTranslationRow> & {
          route_id: string;
          locale: Locale;
          name: string;
        },
        Partial<RouteTranslationRow>
      >;
      route_stops: Table<
        RouteStopRow,
        Partial<RouteStopRow> & {
          route_id: string;
          place_id: string;
          position: number;
        },
        Partial<RouteStopRow>
      >;
      route_stop_translations: Table<
        RouteStopTranslationRow,
        Partial<RouteStopTranslationRow> & {
          route_stop_id: string;
          locale: Locale;
        },
        Partial<RouteStopTranslationRow>
      >;
      sources: Table<
        SourceRow,
        Partial<SourceRow> & {
          entity_type: EntityType;
          entity_id: string;
          url: string;
        },
        Partial<SourceRow>
      >;
      verification_logs: Table<
        VerificationLogRow,
        Partial<VerificationLogRow> & {
          entity_type: EntityType;
          entity_id: string;
          status: VerificationStatus;
        },
        Partial<VerificationLogRow>
      >;
      itineraries: Table<
        ItineraryRow,
        Partial<ItineraryRow> & { session_id: string },
        Partial<ItineraryRow>
      >;
      itinerary_stops: Table<
        ItineraryStopRow,
        Partial<ItineraryStopRow> & {
          itinerary_id: string;
          place_id: string;
          position: number;
        },
        Partial<ItineraryStopRow>
      >;
      analytics_events: Table<
        AnalyticsEventRow,
        Partial<AnalyticsEventRow> & { name: string },
        Partial<AnalyticsEventRow>
      >;
    };
  };
}
