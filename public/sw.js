/* Booking Ledger — service worker
   Strategy:
   - Precache the app shell + offline fallback on install.
   - Network-first for navigations (so users get fresh data when online,
     and a friendly offline page when not).
   - Stale-while-revalidate for static assets (icons, manifest).
   - We never cache Supabase API/auth calls — those must always hit the network.
*/
const CACHE_VERSION = "ledger-v1";
// Precache only static, redirect-free assets. HTML routes are handled at
// runtime (network-first) because authenticated routes may redirect.
const APP_SHELL = [
  "/offline.html",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never intercept cross-origin (Supabase) or auth requests.
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/auth")) return;

  // Navigations: network-first, fall back to cached page, then offline page.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(request, copy)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("/offline.html"))
        )
    );
    return;
  }

  // Static assets: stale-while-revalidate.
  if (
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".ico") ||
    url.pathname.endsWith(".webmanifest")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(request, copy)).catch(() => {});
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});
