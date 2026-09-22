"use client";

import type { AnalyticsEvent } from "@/lib/analytics/events";

/**
 * Envía un evento anónimo (sin PII) a `/api/analytics`. No bloquea el hilo
 * principal ni lanza si falla la solicitud.
 */
export function track(event: AnalyticsEvent): void {
  if (typeof window === "undefined") return;

  const body = JSON.stringify(event);

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/analytics", blob);
      return;
    }
  } catch {
    // sendBeacon puede fallar en algunos navegadores; usamos fetch abajo.
  }

  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => {
    // Analítica es best-effort: nunca debe romper la experiencia del usuario.
  });
}
