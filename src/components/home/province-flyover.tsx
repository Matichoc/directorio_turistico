"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import type { ProvinceFlyoverData } from "@/lib/ui/province-flyover";

// MapLibre pesa: se descarga recién cuando la sección está por entrar en
// pantalla, no con el resto del home.
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

/**
 * "Vuela por la provincia": el relieve real de Petorca en 3D, con la cámara
 * recorriendo las cinco comunas (ver docs/DESIGN.md). Sin WebGL, o sin ningún
 * pueblo con coordenada, la sección no se muestra — nunca un hueco vacío.
 */
export function ProvinceFlyover({ data }: { data: ProvinceFlyoverData }) {
  const t = useTranslations("home.flyover");
  const sectionRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const mountedRef = useRef(false);
  const [visible, setVisible] = useState(false);
  const [webgl, setWebgl] = useState(true);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    // Dos observadores: uno carga el mapa con bastante anticipación, el otro
    // decide si la sección está de verdad a la vista (recién ahí se anima y
    // arranca el recorrido).
    const preload = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !mountedRef.current) {
          mountedRef.current = true;
          setWebgl(supportsWebGL());
          setMounted(true);
        }
      },
      { rootMargin: "900px 0px" },
    );
    const onScreen = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.35 },
    );
    preload.observe(node);
    onScreen.observe(node);
    return () => {
      preload.disconnect();
      onScreen.disconnect();
    };
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
      <div className="glow-edge relative h-[460px] overflow-hidden rounded-2xl border border-white/10 bg-[#07060c] sm:h-[540px]">
        {mounted ? (
          <ProvinceFlyoverMap data={data} active={visible} />
        ) : (
          <div className="h-full w-full animate-pulse bg-gradient-to-br from-[#120a1f] via-[#1d0f22] to-[#0b1220]" />
        )}
      </div>
      <p className="text-foreground/40 text-xs">{t("hint")}</p>
    </section>
  );
}
