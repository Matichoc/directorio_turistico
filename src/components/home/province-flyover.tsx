"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { ProvinceFlyoverData } from "@/lib/ui/province-flyover";

// MapLibre y el relieve pesan unos 4 MB: se descargan recién cuando alguien
// toca "Ver el vuelo 3D" (o un pueblo), nunca con el resto del inicio.
const ProvinceFlyoverMap = dynamic(
  () =>
    import("@/components/home/province-flyover-map").then(
      (mod) => mod.ProvinceFlyoverMap,
    ),
  { ssr: false },
);

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

/** Imagen fija del vuelo (vista general real), ~90 KB: `scripts/capture-flyover-poster.mjs`. */
const POSTER_SRC = "/vuelo/vuelo-poster.webp";

/**
 * "Vuela sobre el valle": el relieve real de Petorca en 3D, con la cámara
 * recorriendo los pueblos (ver docs/DESIGN.md). Al entrar se ve una imagen
 * fija del mismo relieve con "Ver el vuelo 3D": el 3D (~4 MB) se carga recién
 * al tocar el botón o un pueblo (pedido del usuario: "no todos van a querer
 * ver eso"; antes se bajaba solo al acercarse y cada visita al inicio pesaba
 * ~6 MB en vez de ~2). Sin WebGL, o sin ningún pueblo con coordenada, la
 * sección no se muestra — nunca un hueco vacío.
 */
export function ProvinceFlyover({ data }: { data: ProvinceFlyoverData }) {
  const t = useTranslations("home.flyover");
  const sectionRef = useRef<HTMLElement>(null);
  /** null = sin abrir; "tour" = recorrido completo; número = ese pueblo. */
  const [start, setStart] = useState<"tour" | number | null>(null);
  const [visible, setVisible] = useState(false);
  const [webgl, setWebgl] = useState(true);

  useEffect(() => {
    // Diferido: chequear WebGL en el primer render rompería la hidratación.
    queueMicrotask(() => setWebgl(supportsWebGL()));
    const node = sectionRef.current;
    if (!node) return;
    // Fuera de pantalla no se anima nada (el recorrido se pausa solo).
    const onScreen = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.35 },
    );
    onScreen.observe(node);
    return () => onScreen.disconnect();
  }, []);

  if (data.stops.length === 0 || !webgl) return null;

  return (
    <section ref={sectionRef} className="reveal flex flex-col gap-3 px-4">
      <div>
        <h2 className="text-gradient text-2xl font-semibold tracking-tight">
          {t("title")}
        </h2>
        <p className="text-foreground/60 text-sm">{t("subtitle")}</p>
      </div>
      {/* Sin `surface-glass` acá: su desenfoque de fondo (backdrop-filter)
          sobre un mapa que se anima en cada cuadro le costaba fluidez. */}
      <div className="glow-edge bg-background relative h-[460px] overflow-hidden rounded-2xl border border-white/10 sm:h-[540px]">
        {start !== null ? (
          <ProvinceFlyoverMap
            data={data}
            active={visible}
            startAt={start === "tour" ? undefined : start}
          />
        ) : (
          <button
            type="button"
            onClick={() => setStart("tour")}
            className="group absolute inset-0 flex flex-col items-center justify-center gap-3 text-white"
          >
            <Image
              src={POSTER_SRC}
              alt={t("posterAlt")}
              fill
              sizes="(min-width: 768px) 736px, 100vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <span
              aria-hidden="true"
              className="from-background/90 via-background/30 to-background/15 absolute inset-0 bg-gradient-to-t"
            />
            <span className="bg-accent text-accent-foreground relative rounded-full px-6 py-3 text-base font-semibold shadow-[0_0_30px_6px_var(--accent-soft)] transition-transform group-hover:scale-105">
              {t("start")}
            </span>
            <span className="absolute inset-x-4 bottom-4 text-center text-xs text-white/85">
              {t("startNote")}
            </span>
          </button>
        )}
      </div>
      {start === null ? (
        <>
          {/* Tocar un pueblo abre el 3D y vuela directo a él. */}
          <div className="flex flex-wrap gap-2">
            {data.stops.map((stop, stopIndex) => (
              <button
                key={stop.id}
                type="button"
                onClick={() => setStart(stopIndex)}
                className="hover:border-accent rounded-full border border-white/15 px-3 py-1.5 text-xs transition-colors"
              >
                {stop.name}
              </button>
            ))}
          </div>
          <p className="text-foreground/40 text-xs">{t("credit")}</p>
        </>
      ) : (
        <p className="text-foreground/40 text-xs">{t("hint")}</p>
      )}
    </section>
  );
}
