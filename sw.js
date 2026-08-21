/* Goal Console service worker — cache-first app shell.
   Bump CACHE_VERSION whenever any precached file changes, or installed
   phones will keep serving the old build. */
const CACHE_VERSION = "goal-console-v1";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  // Never intercept cross-origin traffic (Google auth/Drive API must hit the network).
  if (url.origin !== self.location.origin || e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: e.request.mode === "navigate" }).then((hit) => {
      if (hit) return hit;
      return fetch(e.request).catch(() => {
        // Offline navigation to an uncached path: serve the app shell.
        if (e.request.mode === "navigate") return caches.match("./index.html");
        throw new Error("offline");
      });
    })
  );
});
