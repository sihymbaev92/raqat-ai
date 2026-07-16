/* eslint-disable no-restricted-globals */
/**
 * Web хатым офлайн: QCF4 бет JSON және қаріп файлдарын cache-first сақтау.
 * Expo web export: public/ → dist түбі.
 */
const CACHE = "raqat-hatim-qcf4-v1";
const PAGE_JSON_RE = /\/pages\/\d{3}\.json(?:\?.*)?$/i;
const QCF4_FONT_RE = /\/fonts(?:-woff2)?\/[^/]+\.(?:ttf|woff2)(?:\?.*)?$/i;
const FONT_MAP_RE = /\/qcf4\/font-map\.json(?:\?.*)?$/i;

function isHatimAssetRequest(url) {
  const path = url.pathname + url.search;
  return PAGE_JSON_RE.test(path) || QCF4_FONT_RE.test(path) || FONT_MAP_RE.test(path);
}

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith("raqat-hatim-qcf4-") && k !== CACHE).map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (!isHatimAssetRequest(url)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(event.request);
      if (cached) return cached;
      try {
        const response = await fetch(event.request);
        if (response.ok) {
          await cache.put(event.request, response.clone());
        }
        return response;
      } catch (err) {
        if (cached) return cached;
        throw err;
      }
    })()
  );
});
