// MAX SNCF service worker — keeps the app shell available offline.
// Data (trips, QR, subscription) is persisted separately via the React Query
// cache in localStorage, so this SW only needs to serve the shell + assets.

// Bump on every cache-shape change: `activate` deletes all other caches, which
// also evicts any old JS bundle that had a stale NEXT_PUBLIC_PROXY_URL baked in
// (the cause of "works on desktop, dead on the phone" — the phone served a
// cached bundle still pointing at localhost:3333).
const CACHE = "max-sncf-v2";
const APP_SHELL = ["/", "/trips", "/search", "/subscription", "/manifest.json"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(APP_SHELL).catch(() => {})),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Only handle same-origin requests; let the proxy API hit the network
  // (offline data is served from the React Query cache).
  if (url.origin !== self.location.origin) return;

  // Navigations: network-first, fall back to cached page then to the app root.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(async () => {
          return (
            (await caches.match(request)) ||
            (await caches.match("/")) ||
            Response.error()
          );
        }),
    );
    return;
  }

  // App code under /_next/ carries the build-time NEXT_PUBLIC_* values, so it
  // must be network-first: always take the fresh bundle when online, fall back
  // to cache only when offline. Stale-while-revalidate here would pin an old
  // bundle (e.g. one baked against localhost) and silently break API calls.
  if (url.pathname.startsWith("/_next/")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => caches.match(request).then((c) => c || Response.error())),
    );
    return;
  }

  // Other static assets (icons, fonts, manifest): stale-while-revalidate.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
