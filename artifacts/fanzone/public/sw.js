const CACHE_NAME = "fanzone-v2";
const STATIC_ASSETS = [
  "./",
  "./manifest.json",
  "./favicon.svg",
  "./icons/icon-192.svg",
  "./icons/icon-512.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Skip non-GET, non-http(s), and Capacitor bridge requests
  if (
    request.method !== "GET" ||
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.pathname.startsWith("/api/") ||
    url.hostname === "capacitor"
  ) {
    return;
  }

  // Skip Clerk and external auth endpoints — always network
  if (
    url.hostname.includes("clerk") ||
    url.hostname.includes("accounts.dev") ||
    url.hostname.includes("firebase")
  ) {
    return;
  }

  // Navigation: network-first, cache fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          return res;
        })
        .catch(() =>
          caches.match(request).then(
            (r) =>
              r ||
              caches
                .match("./")
                .then((r2) => r2 || new Response("Offline", { status: 503 }))
          )
        )
    );
    return;
  }

  // Static assets: cache-first
  if (
    url.pathname.match(/\.(js|css|svg|png|jpg|jpeg|webp|woff2?|ico|json)$/) ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/assets/")
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
            return res;
          })
      )
    );
    return;
  }
});
