import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { AnalyticsEventName } from "@/lib/analytics/events";

export interface AnalyticsRow {
  value: string;
  total: number;
}

/**
 * Los valores más repetidos de una propiedad de un evento en los últimos
 * `days` días (ver `analytics_top` en la migración 0023). Solo un admin
 * recibe filas — para el resto la RLS devuelve vacío.
 */
export async function getAnalyticsTop(
  name: AnalyticsEventName,
  key: string,
  days = 30,
  limit = 10,
): Promise<AnalyticsRow[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("analytics_top", {
    p_name: name,
    p_key: key,
    p_days: days,
    p_limit: limit,
  });
  if (error || !data) {
    return [];
  }
  return data.map((row) => ({ value: row.value, total: Number(row.total) }));
}

export async function getAnalyticsTotals(
  days = 30,
): Promise<Partial<Record<AnalyticsEventName, number>>> {
  if (!isSupabaseConfigured()) {
    return {};
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("analytics_totals", {
    p_days: days,
  });
  if (error || !data) {
    return {};
  }
  return Object.fromEntries(
    data.map((row) => [row.name, Number(row.total)]),
  ) as Partial<Record<AnalyticsEventName, number>>;
}
