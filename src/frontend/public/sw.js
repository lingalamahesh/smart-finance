const CACHE_NAME = "myfinance-v1";
const PRECACHE_URLS = ["/", "/index.html", "/manifest.json"];

// URLs that should NEVER be cached (canister calls, external APIs)
const BYPASS_PATTERNS = [
  "icp0.io",
  "ic0.app",
  "coingecko",
  "agent",
  "/api",
];

function shouldBypass(url) {
  return BYPASS_PATTERNS.some((pattern) => url.includes(pattern));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
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
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = request.url;

  // Always bypass: non-GET, external/canister/API requests
  if (request.method !== "GET" || shouldBypass(url)) {
    return; // let browser handle normally
  }

  try {
    const parsed = new URL(url);
    const isSameOrigin = parsed.origin === self.location.origin;

    if (isSameOrigin) {
      // Cache-first strategy for same-origin assets
      event.respondWith(
        caches.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            if (!response || response.status !== 200 || response.type === "error") {
              return response;
            }
            const cloned = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, cloned));
            return response;
          });
        }),
      );
    } else {
      // Network-first for cross-origin (fonts, CDN assets)
      event.respondWith(
        fetch(request).catch(() => caches.match(request)),
      );
    }
  } catch {
    // If URL parsing fails, skip caching
  }
});
