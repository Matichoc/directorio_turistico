"use client";

import { useState, useSyncExternalStore } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getMapStyleUrl } from "@/lib/maps/config";
import {
  boundsAround,
  fontStacksIn,
  staticAssetsIn,
  tilesInBounds,
  tileUrl,
  type Bounds,
  type LatLng,
} from "@/lib/offline/plan";

/** Registro de lo guardado (lo lee también public/offline.html). */
const REGISTRY_KEY = "petorca-offline";
const SAVED_EVENT = "offline:saved";
/** Peso aproximado de una tesela del mapa, para avisar cuánto se baja. */
const TILE_MB = 0.03;
const MAX_ZOOM = 14;
const MIN_ZOOM = 8;
const GLYPH_RANGES = ["0-255", "256-511", "8192-8447"];

interface SavedEntry {
  key: string;
  title: string;
  url: string;
  savedAt: string;
}

function readRegistry(): SavedEntry[] {
  try {
    return JSON.parse(localStorage.getItem(REGISTRY_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function writeRegistry(entry: SavedEntry) {
  const others = readRegistry().filter((item) => item.key !== entry.key);
  localStorage.setItem(REGISTRY_KEY, JSON.stringify([entry, ...others]));
  window.dispatchEvent(new Event(SAVED_EVENT));
}

function subscribeRegistry(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(SAVED_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(SAVED_EVENT, onChange);
  };
}

const noop = () => () => {};
const isSupported = () =>
  "caches" in window && "serviceWorker" in navigator && "fetch" in window;

interface MapSource {
  url?: string;
  tiles?: string[];
  maxzoom?: number;
}

/** URLs del mapa (estilo, teselas, letras, íconos) que cubren `bounds`. */
async function mapUrls(bounds: Bounds): Promise<string[]> {
  const styleUrl = getMapStyleUrl();
  const style = (await (await fetch(styleUrl)).json()) as {
    sources?: Record<string, MapSource>;
    sprite?: string | { url: string }[];
    glyphs?: string;
    layers?: { layout?: Record<string, unknown> }[];
  };
  const urls = [styleUrl];

  for (const source of Object.values(style.sources ?? {})) {
    let template = source.tiles?.[0];
    let maxZoom = source.maxzoom ?? MAX_ZOOM;
    if (source.url) {
      urls.push(source.url);
      const tileJson = (await (await fetch(source.url)).json()) as MapSource;
      template = tileJson.tiles?.[0];
      maxZoom = tileJson.maxzoom ?? maxZoom;
    }
    if (!template) continue;
    const top = Math.min(maxZoom, MAX_ZOOM);
    for (const tile of tilesInBounds(bounds, Math.min(MIN_ZOOM, top), top)) {
      urls.push(tileUrl(template, tile));
    }
  }

  const sprites =
    typeof style.sprite === "string"
      ? [style.sprite]
      : (style.sprite ?? []).map((sprite) => sprite.url);
  for (const sprite of sprites) {
    for (const suffix of [".json", ".png", "@2x.json", "@2x.png"]) {
      urls.push(`${sprite}${suffix}`);
    }
  }

  if (style.glyphs) {
    for (const stack of fontStacksIn(style)) {
      for (const range of GLYPH_RANGES) {
        urls.push(
          style.glyphs.replace("{fontstack}", stack).replace("{range}", range),
        );
      }
    }
  }
  return urls;
}

/** Corre `tasks` de a `size` a la vez; devuelve cuántas fallaron. */
async function pool(
  tasks: (() => Promise<unknown>)[],
  size: number,
  onDone: () => void,
) {
  let next = 0;
  let failed = 0;
  async function worker() {
    while (next < tasks.length) {
      const task = tasks[next++];
      try {
        await task();
      } catch {
        failed++;
      }
      onDone();
    }
  }
  await Promise.all(Array.from({ length: size }, worker));
  return failed;
}

async function fetchOk(url: string) {
  const response = await fetch(url, { credentials: "same-origin" });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response;
}

type Status =
  | { kind: "idle" }
  | { kind: "saving"; done: number; total: number }
  | { kind: "error" };

/**
 * "Guardar para usar sin señal" (pedido del usuario: que funcione sin señal
 * en el valle). Guarda en el teléfono las páginas de la ruta y sus paradas
 * (con su JS y CSS) y el mapa de la zona, que después sirve `public/sw.js`
 * sin red. La guía por calle sí necesita conexión; sin ella siguen el mapa,
 * tu posición y las fichas.
 */
export function OfflineSaveButton({
  saveKey,
  title,
  pages,
  points,
}: {
  /** Identifica lo guardado (p. ej. `ruta:<slug>`). */
  saveKey: string;
  /** Cómo aparece en la página sin señal. */
  title: string;
  /** Rutas del sitio a guardar; la primera es la que se abre sin señal. */
  pages: string[];
  points: LatLng[];
}) {
  const t = useTranslations("offline");
  const locale = useLocale();
  const supported = useSyncExternalStore(noop, isSupported, () => false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const savedAt = useSyncExternalStore(
    subscribeRegistry,
    () => readRegistry().find((item) => item.key === saveKey)?.savedAt ?? null,
    () => null,
  );

  const bounds = boundsAround(points);
  if (!supported || pages.length === 0) return null;

  const estimateMb = Math.max(
    1,
    Math.round(
      (bounds ? tilesInBounds(bounds, MIN_ZOOM, MAX_ZOOM).length : 0) *
        TILE_MB +
        pages.length * 0.15,
    ),
  );

  async function save() {
    setStatus({ kind: "saving", done: 0, total: 1 });
    try {
      await navigator.storage?.persist?.();
      // Que el service worker esté activo: es el que guarda archivos y mapa.
      await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((resolve) => setTimeout(resolve, 3000)),
      ]);

      const pagesCache = await caches.open("pages");
      const assets = new Set<string>();
      const pageTasks = pages.map((path) => async () => {
        const response = await fetchOk(path);
        for (const asset of staticAssetsIn(await response.clone().text())) {
          assets.add(asset);
        }
        await pagesCache.put(
          new Request(new URL(path, location.origin).href),
          response,
        );
      });

      let done = 0;
      let total = pageTasks.length;
      const tick = () =>
        setStatus({ kind: "saving", done: ++done, total: Math.max(total, 1) });

      let failed = await pool(pageTasks, 3, tick);
      // Sin el mapa no sirve para el valle: si no se pudo leer su estilo,
      // se avisa (las páginas igual quedan guardadas).
      let mapFailed = false;
      const mapList = bounds
        ? await mapUrls(bounds).catch(() => {
            mapFailed = true;
            return [];
          })
        : [];
      const urls = [...assets, ...mapList];
      total += urls.length;
      failed += await pool(
        urls.map((url) => () => fetchOk(url)),
        6,
        tick,
      );

      // Lo esencial son las páginas; del resto se acepta alguna falla suelta.
      if (mapFailed || failed > Math.max(2, total * 0.05)) {
        throw new Error("incompleto");
      }

      writeRegistry({
        key: saveKey,
        title,
        url: pages[0],
        savedAt: new Date().toISOString(),
      });
      setStatus({ kind: "idle" });
    } catch {
      setStatus({ kind: "error" });
    }
  }

  const base =
    "flex items-center gap-2 self-start rounded-full px-4 py-2 text-sm font-medium transition-shadow";

  if (status.kind === "saving") {
    const percent = Math.round((status.done / status.total) * 100);
    return (
      <p role="status" className={`${base} surface-glass`}>
        {t("saving", { percent })}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      {savedAt && status.kind === "idle" ? (
        <p className="text-foreground/80 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-emerald-400">✓</span>
          {t("saved", {
            date: new Date(savedAt).toLocaleDateString(
              ({ en: "en", pt: "pt-BR" } as Record<string, string>)[locale] ??
                "es-CL",
            ),
          })}
          <button
            type="button"
            onClick={() => void save()}
            className="text-accent underline underline-offset-2"
          >
            {t("update")}
          </button>
        </p>
      ) : (
        <button
          type="button"
          onClick={() => void save()}
          className={`${base} surface-glass hover:border-accent border border-white/10 hover:shadow-[0_0_20px_2px_var(--accent-soft)]`}
        >
          ⬇ {t("save", { mb: estimateMb })}
        </button>
      )}
      {status.kind === "error" && (
        <p role="alert" className="text-xs text-amber-300">
          {t("error")}
        </p>
      )}
      <p className="text-foreground/50 text-xs">{t("hint")}</p>
    </div>
  );
}
