"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  SPEECH_LANG,
  isSpeechSupported,
  pickVoice,
  preloadVoices,
  splitIntoChunks,
} from "@/lib/speech";

type Status = "idle" | "playing" | "paused";

/** Velocidades que ofrece el botón, en orden de rotación. */
const RATES = [1, 1.25, 0.8] as const;

const noop = () => () => {};

/**
 * "Escuchar": lee en voz alta un apartado de la página con la voz del
 * teléfono. Pedido del usuario (2026-11-01): "que se puedan escuchar las
 * páginas… un botón de play para algunos apartados, sobre todo para cuando
 * la gente va manejando". Nunca suena solo: hay que tocarlo (WCAG 1.4.2). Se
 * puede pausar, seguir, detener y cambiar la velocidad. Sin soporte en el
 * navegador no se muestra. Basado en `ListenButton` del directorio de Papudo.
 */
export function ListenButton({
  segments,
  name,
}: {
  /** Textos en el orden en que se leen (título, descripción, paradas…). */
  segments: (string | null | undefined)[];
  /** Qué se escucha, para el lector de pantalla ("Escuchar {name}"). */
  name: string;
}) {
  const t = useTranslations("listen");
  const locale = useLocale();
  const lang = SPEECH_LANG[locale === "en" ? "en" : "es"];
  const supported = useSyncExternalStore(noop, isSpeechSupported, () => false);
  const [status, setStatus] = useState<Status>("idle");
  const [rate, setRate] = useState<number>(RATES[0]);
  const [noVoice, setNoVoice] = useState(false);
  const chunks = useRef<string[]>([]);
  const index = useRef(0);
  // Cada lectura tiene su número: los avisos de fin de una lectura cancelada
  // (algunos navegadores los disparan al cancelar) se ignoran.
  const session = useRef(0);

  useEffect(() => {
    if (!isSpeechSupported()) return;
    const synth = window.speechSynthesis;
    const started = session;
    const stopPreloading = preloadVoices();
    return () => {
      stopPreloading();
      // Al salir de la página se corta la lectura, si este botón la empezó.
      if (started.current > 0) synth.cancel();
    };
  }, []);

  if (!supported) return null;

  function speakFrom(start: number, speed: number) {
    const synth = window.speechSynthesis;
    const id = ++session.current;
    synth.cancel();
    const voices = synth.getVoices();
    if (voices.length > 0 && !pickVoice(voices, lang)) {
      setNoVoice(true);
      setStatus("idle");
      return;
    }
    const say = (n: number) => {
      if (id !== session.current) return;
      if (n >= chunks.current.length) {
        index.current = 0;
        setStatus("idle");
        return;
      }
      index.current = n;
      // Se elige en cada trozo: la lista puede llegar con la lectura empezada.
      const voice = pickVoice(synth.getVoices(), lang);
      const utterance = new SpeechSynthesisUtterance(chunks.current[n]);
      utterance.lang = voice?.lang ?? lang;
      if (voice) utterance.voice = voice;
      utterance.rate = speed;
      utterance.onend = () => say(n + 1);
      utterance.onerror = (e) => {
        if (e.error === "interrupted" || e.error === "canceled") return;
        if (id === session.current) setStatus("idle");
      };
      synth.speak(utterance);
    };
    setStatus("playing");
    say(start);
  }

  function toggle() {
    if (status === "playing") {
      session.current++;
      window.speechSynthesis.cancel();
      setStatus("paused");
      return;
    }
    if (status === "idle") {
      chunks.current = segments.flatMap((segment) =>
        segment ? splitIntoChunks(segment) : [],
      );
      index.current = 0;
    }
    speakFrom(index.current, rate);
  }

  function stop() {
    session.current++;
    window.speechSynthesis.cancel();
    index.current = 0;
    setStatus("idle");
  }

  function changeRate() {
    const next = RATES[(RATES.indexOf(rate as never) + 1) % RATES.length];
    setRate(next);
    if (status === "playing") speakFrom(index.current, next);
  }

  const rateText = `${String(rate).replace(".", locale === "en" ? "." : ",")}×`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        aria-label={status === "idle" ? t("playLabel", { name }) : undefined}
        className="bg-accent text-accent-foreground inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-[0_0_16px_1px_var(--accent-soft)] transition active:scale-95"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="currentColor"
          aria-hidden="true"
        >
          {status === "playing" ? (
            <>
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </>
          ) : (
            <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
          )}
        </svg>
        {status === "playing"
          ? t("pause")
          : status === "paused"
            ? t("resume")
            : t("play")}
      </button>
      {status !== "idle" && (
        <button
          type="button"
          onClick={stop}
          className="border-accent-soft hover:border-accent rounded-full border px-3 py-2 text-sm transition active:scale-95"
        >
          {t("stop")}
        </button>
      )}
      <button
        type="button"
        onClick={changeRate}
        aria-label={t("speedLabel", { rate: rateText })}
        className="text-foreground/70 hover:text-foreground rounded-full px-2 py-2 text-sm"
      >
        {rateText}
      </button>
      {noVoice && (
        <span className="text-foreground/50 text-xs">{t("noVoice")}</span>
      )}
    </div>
  );
}
