"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { SCENE_POSITION, SCENE_SRC } from "@/lib/ui/scene-backgrounds";
import { embedUrl, formatDuration, type Reportaje } from "@/lib/reportajes";

/**
 * Un reportaje de TV (`lib/reportajes.ts`). Hasta que se toca "Ver" es una
 * tarjeta con nuestra escena del diablo, el canal y el título: el reproductor
 * del canal (YouTube sin cookies o Rudo) recién se carga al tocar, así la
 * página no baja megas de video ni cookies de terceros si nadie lo mira.
 * Nunca un video descargado: siempre el reproductor oficial y el link al
 * original.
 */
export function VideoReportaje({ reportaje }: { reportaje: Reportaje }) {
  const t = useTranslations("videos");
  const locale = useLocale();
  const [playing, setPlaying] = useState(false);

  const meta = [
    reportaje.durationMinutes ? formatDuration(reportaje.durationMinutes) : "",
    reportaje.publishedAt
      ? new Date(`${reportaje.publishedAt}T12:00:00`).toLocaleDateString(
          locale,
          { day: "numeric", month: "long", year: "numeric" },
        )
      : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="flex flex-col gap-1.5">
      <div className="bg-background relative aspect-video overflow-hidden rounded-2xl border border-white/10">
        {playing ? (
          <iframe
            src={embedUrl(reportaje)}
            title={reportaje.title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 size-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`${t("play")}: ${reportaje.title}`}
            className="group hover:border-accent absolute inset-0 flex flex-col justify-between p-3 text-left text-white transition-shadow hover:shadow-[0_0_28px_2px_var(--accent-soft)]"
          >
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-cover transition-transform duration-700 ease-out group-hover:scale-105"
              style={{
                backgroundImage: `url(${SCENE_SRC[reportaje.scene]})`,
                backgroundPosition: SCENE_POSITION[reportaje.scene],
              }}
            />
            <span
              aria-hidden="true"
              className="from-background/95 via-background/55 to-background/25 absolute inset-0 bg-gradient-to-t"
            />
            <span className="bg-background/80 relative w-fit rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide">
              {reportaje.channel}
            </span>
            <span
              aria-hidden="true"
              className="bg-accent text-accent-foreground relative mx-auto flex h-14 w-14 items-center justify-center rounded-full text-xl shadow-[0_0_24px_4px_var(--accent-soft)] transition-transform group-hover:scale-110"
            >
              ▶
            </span>
            <span className="relative flex flex-col gap-0.5">
              <span className="line-clamp-2 text-sm leading-snug font-semibold">
                {reportaje.title}
              </span>
              <span className="text-xs text-white/70">
                {meta ? `${t("play")} · ${meta}` : t("play")}
              </span>
            </span>
          </button>
        )}
      </div>
      <a
        href={reportaje.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-foreground/60 hover:text-accent w-fit text-xs underline-offset-2 hover:underline"
      >
        {t("watchOn", { site: reportaje.sourceSite })} ↗
      </a>
    </article>
  );
}
