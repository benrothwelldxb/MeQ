// Minimal service worker. Required so the browser treats the app as
// installable (the criteria include "has a registered service worker that
// handles fetch events"). We don't cache anything aggressively yet — that
// can come later if offline-first is wanted. For now it just acts as a
// passthrough to the network.

self.addEventListener("install", () => {
  // Activate immediately so a refresh after install isn't required.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Take control of any uncontrolled clients (e.g. open tabs that loaded
  // before the SW registered).
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Network-only passthrough. Required for PWA install criteria — the SW
  // must declare a fetch handler. No caching today; the app needs to talk to
  // the server every time anyway (auth, real-time data).
  event.respondWith(fetch(event.request));
});
