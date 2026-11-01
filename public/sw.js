/*
 * Service worker de "El diablo murió en Petorca": que el sitio funcione sin
 * señal en el valle (pedido del usuario). Escrito a mano y servido tal cual
 * desde public/: el plugin de Serwist que había no corre con Turbopack (el
 * build de Next 16), así que el sitio publicado nunca tuvo service worker.
 * Ver docs/DESIGN.md, "Sin señal".
 *
 * - Páginas: primero la red (con un tope de espera); sin red, la copia
 *   guardada; sin copia, /offline.html (que lista lo guardado).
 * - /_next/static: guardado para siempre (los nombres llevan hash).
 * - Imágenes y mapa (OpenFreeMap): se guardan al verse o al tocar
 *   "Guardar para usar sin señal" (components/offline/offline-save-button).
 * - /api y los datos de navegación de Next (RSC): siempre a la red. Si
 *   fallan, Next recarga la página entera y esa sí sale de la copia.
 *
 * Al cambiar algo acá, subir VERSION.
 */
const VERSION = "2026-11-01";
const OFFLINE_URL = "/offline.html";
const SHELL = `shell-${VERSION}`;
const LIMITS = { pages: 120, images: 400, map: 5000 };
const PAGE_TIMEOUT_MS = 6000;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) =>
        cache.addAll([
          OFFLINE_URL,
          "/manifest.webmanifest",
          "/icons/icon-192.png",
        ]),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("shell-") && key !== SHELL)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/** Deja como mucho `max` entradas, borrando las más antiguas. */
async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

async function put(cacheName, request, response) {
  if (!response || !(response.ok || response.type === "opaque")) return;
  const cache = await caches.open(cacheName);
  await cache.put(request, response);
  if (LIMITS[cacheName]) trim(cacheName, LIMITS[cacheName]);
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request, { ignoreVary: true });
  if (cached) return cached;
  const response = await fetch(request);
  await put(cacheName, request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request, { ignoreVary: true });
  const network = fetch(request)
    .then(async (response) => {
      await put(cacheName, request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || (await network) || Response.error();
}

/** Página: la red primero; si tarda o falla, la copia guardada. */
async function page(request) {
  const key = new Request(new URL(request.url).href);
  const fromNetwork = fetch(request).then(async (response) => {
    if (response.ok) await put("pages", key, response.clone());
    return response;
  });
  // Si gana la copia guardada, un error tardío de la red no es un problema.
  fromNetwork.catch(() => {});
  const cached = await caches.match(key, { ignoreVary: true });
  try {
    if (!cached) return await fromNetwork;
    const timeout = new Promise((resolve) =>
      setTimeout(() => resolve(null), PAGE_TIMEOUT_MS),
    );
    return (await Promise.race([fromNetwork, timeout])) || cached;
  } catch {
    return cached || (await caches.match(OFFLINE_URL)) || Response.error();
  }
}

const IMAGE_FILE = /\.(png|jpe?g|webp|avif|gif|svg|ico)$/i;

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(page(request));
    return;
  }

  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith("/_next/static/")) {
      event.respondWith(cacheFirst(request, "static"));
    } else if (
      url.pathname.startsWith("/api/") ||
      url.searchParams.has("_rsc") ||
      request.headers.has("RSC")
    ) {
      return;
    } else if (
      url.pathname.startsWith("/_next/image") ||
      request.destination === "image" ||
      IMAGE_FILE.test(url.pathname)
    ) {
      event.respondWith(staleWhileRevalidate(request, "images"));
    }
    return;
  }

  // Mapa: el estilo y la descripción de las teselas pueden cambiar (se
  // actualizan en segundo plano); teselas, letras e íconos no.
  if (url.hostname === "tiles.openfreemap.org") {
    const changes =
      url.pathname.startsWith("/styles/") ||
      !url.pathname.slice(1).includes("/");
    event.respondWith(
      changes
        ? staleWhileRevalidate(request, "map")
        : cacheFirst(request, "map"),
    );
  }
});
