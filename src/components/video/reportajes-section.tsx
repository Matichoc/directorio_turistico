import type { ReactNode } from "react";
import type { Reportaje } from "@/lib/reportajes";
import { VideoReportaje } from "@/components/video/video-reportaje";

/**
 * Sección de reportajes de TV: título, bajada y una grilla de videos. Va en
 * la leyenda (todos), en la ruta del poncho (los de esa ruta) y en el inicio
 * (el destacado). DESIGN.md, "Petorca en la tele".
 */
export function ReportajesSection({
  id,
  title,
  subtitle,
  items,
  footer,
}: {
  id?: string;
  title: string;
  subtitle?: string;
  items: Reportaje[];
  footer?: ReactNode;
}) {
  if (items.length === 0) return null;
  return (
    <section id={id} className="reveal flex scroll-mt-20 flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-xl font-semibold">{title}</h2>
        {subtitle && <p className="text-foreground/60 text-sm">{subtitle}</p>}
      </div>
      <div className={`grid gap-4 ${items.length > 1 ? "sm:grid-cols-2" : ""}`}>
        {items.map((reportaje) => (
          <VideoReportaje key={reportaje.key} reportaje={reportaje} />
        ))}
      </div>
      {footer}
    </section>
  );
}
